/* _________________________________________________________________________
 *
 *             Tachyon : A Self-Hosted JavaScript Virtual Machine
 *
 *
 *  This file is part of the Tachyon JavaScript project. Tachyon is
 *  distributed at:
 *  http://github.com/Tachyon-Team/Tachyon
 *
 *
 *  Copyright (c) 2011, Universite de Montreal
 *  All rights reserved.
 *
 *  This software is licensed under the following license (Modified BSD
 *  License):
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the Universite de Montreal nor the names of its
 *      contributors may be used to endorse or promote products derived
 *      from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 *  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 *  TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 *  PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL UNIVERSITE DE
 *  MONTREAL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 *  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 *  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * _________________________________________________________________________
 */

/**
    @fileOverview
    RegExp parser.

    @author
    Olivier Matz
*/

function RegExpParser () {}

/**
    Parses pattern and returns corresponding AST.
*/
RegExpParser.prototype.parse = function (
    pattern
)
{
    this.pattern = pattern;

    // Init current char cursor.
    this.index = -1;
    this.advance();
    this.lastGroupId = -1;

    // Parse root disjunction.
    return this.parseDisjunction(true, false);
}

/**
    Returns current character code.
*/ 
RegExpParser.prototype.current = function ()
{
    return this.curCharCode;
} 

/**
    Advance cursor one character.
*/
RegExpParser.prototype.advance = function ()
{
    this.curCharCode = ++this.index < this.pattern.length ?
                       this.pattern.charCodeAt(this.index) :
                       null;
}

RegExpParser.prototype.error = function (
    msg
)
{
    print("RegExp parser error at " + this.index + " : " + msg);
}

/**
    Disjunction ::
        Alternative
        Alternative | Disjunction
*/
function RegExpDisjunction (
    captures, 
    isRoot,
    groupId
)
{
    this.alternatives = [];
    this.captures = captures;
    this.isRoot= isRoot;
    this.groupId = groupId;
}

/**
    Disjunction pretty print.
*/
RegExpDisjunction.prototype.pp = function (
    level
)
{
    if (level === undefined)
        level = 0;

    var s = genLevel(level) + "Disjunction (" + (this.captures ? "capture)\n" : "no capture)\n");

    for (var i = 0; i < this.alternatives.length; ++i)
        s += this.alternatives[i].pp(level + 1);
    return s;
}

/**
    Parse a disjunction from the current position. 
*/
RegExpParser.prototype.parseDisjunction = function (
    captures, 
    isRoot
)
{
    var node = new RegExpDisjunction(captures, isRoot, ++(this.lastGroupId));

    while (true)
    {
        switch (this.current())
        {
            case null: // EOL
            if (node.isRoot)
                this.advance();
            return node;

            case 41: // ')'
            this.advance();
            if (this.isRoot)
                this.error("unmatched )");
            return node;

            case 124: // '|'
            this.advance();
            break;

            default:
            node.alternatives.push(this.parseAlternative());
            break;
        }
    }
}

/**
    Alternative ::
      [empty]
      Alternative Term
*/
function RegExpAlternative ()
{
    this.terms = [];
}

/**
    Alternative pretty print.
*/
RegExpAlternative.prototype.pp = function (
    level
)
{
    var s = genLevel(level) + "Alternative\n";

    for (var i = 0; i < this.terms.length; i++)
        s += this.terms[i].pp(level + 1);
    return s;
}

/**
    Parse an alternative from the current character. 
*/
RegExpParser.prototype.parseAlternative = function ()
{
    var node = new RegExpAlternative();

    while (true)
    {
        switch (this.current())
        {
            case null: // EOL
            case 124: // '|'
            case 41: // ')'
            return node;

            default:
            node.terms.push(this.parseTerm());
        }
    }
}

/**
    Term ::
      Assertion
      Atom
      Atom Quantifier
*/
function RegExpTerm () {}

/**
    Term pretty print.
*/
RegExpTerm.prototype.pp = function (level)
{
    var s = genLevel(level) + "Term\n";

    if (this.prefix !== undefined)
        s += this.prefix.pp(level + 1);
    if (this.quantifier !== undefined)
        s += this.quantifier.pp(level + 1);
    return s;
}

/**
    Parse a term from the current character. 
*/
RegExpParser.prototype.parseTerm = function ()
{
    var node = new RegExpTerm();

    switch (this.current())
    {
        case null: // EOL
        return node; 

        // Assertion parsing.
        case 94: // '^'
        case 36: // '$'
        node.prefix = new RegExpAssertion(this.current(), true);
        this.advance();
        return node;

        // Sub-disjunction (either atom or assertion).
        case 40: // '('
        this.advance();
        if (this.current() === 63) // '?'
        {
            this.advance();
            if (this.current() === 61) // '='
            {
                this.advance();
                node.prefix = new RegExpAssertion(this.parseDisjunction(false, false), true);
            }
            else if (this.current() === 33) // '!'
            {
                this.advance();
                node.prefix = new RegExpAssertion(this.parseDisjunction(false, false), false);
            }
            else if (this.current() === 58) // ':'
            {
                this.advance();
                node.prefix = new RegExpAtom(this.parseDisjunction(false, false));
            }
            else
            {
                this.error("invalid group");
            }
        }
        else
        {
            node.prefix = new RegExpAtom(this.parseDisjunction(true, false));
        }
        break;

        // Escaped sequence
        case 92: // '\'
        this.advance();
        // \b and \B are word boundary assertion.
        if (this.current() === 98) // 'b' 
        {
            this.advance();
            node.prefix = new RegExpAssertion(98, true);
        }
        else if (this.current() === 66) // 'B' 
        {
            this.advance();
            node.prefix = new RegExpAssertion(98, false);
        }
        else
        {
            node.prefix = new RegExpAtom(this.parseAtomEscape());
        }
        break;

        // Atom
        case 46: // '.'
        // Equivalent to everything except newline.
        var cc = new RegExpCharacterClass(false);
        cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(10)));
        node.prefix = new RegExpAtom(cc);
        this.advance();
        break;

        case 41: // ')'
        return node;

        // CharacterClass
        case 91: // '['
        node.prefix = new RegExpAtom(this.parseCharacterClass());
        break;

        // Skip terminator and quantifier since it will be parsed just below.
        case 42: // '*'
        case 43: // '+'
        case 63: // '?'
        case 123: // '{'
        case 125: // '}'
        case 93: // ']'
        case 93: // '|'
        break;

        // PatternCharacter
        default:
        node.prefix = new RegExpAtom(new RegExpPatternCharacter(this.current()));
        this.advance();
        break;
    }

    // Quantifier reading.
    switch (this.current())
    {
        case 42: // '*'
        case 43: // '+'
        case 63: // '?'
        case 123: // '{'
        if (node.prefix === undefined || node.prefix instanceof RegExpAssertion)
            this.error("invalid quantifier without atom");
        else
            node.quantifier = this.parseQuantifier();
    }

    if (node.quantifier === undefined)
    {
        node.quantifier = new RegExpQuantifier();
        node.quantifier.greedy = true;
        node.quantifier.min = 1;
        node.quantifier.max = 1;
    }
    return node;
}

/**
    Assertion ::
      ^
      $
      \b
      \B
      (?= Disjunction)
      (?! Disjunction)

      @params {Integer | RegExpDisjunction} value
*/
function RegExpAssertion(
    value,
    positive
)
{
    this.value = value;
    this.positive = positive;
}

RegExpAssertion.prototype.pp = function (level)
{
    var s = genLevel(level) + "Assertion (" + (this.positive ? "positive) " : "negative) ");

    if (this.value instanceof RegExpDisjunction)
        s += "\n" + this.value.pp(level + 1);
    else
        s += " " + this.value + "\n";
    return s;
}

/**
    Quantifier ::
        QuantifierPrefix
        QuantifierPrefix ?

    QuantifierPrefix ::
        *
        +
        ?
        { DecimalDigits }
        { DecimalDigits , }
        { DecimalDigits , DecimalDigits }
*/

function RegExpQuantifier ()
{
    this.min = 1;
    this.max = 1;
    this.greedy = true;
}

/**
    Quantifier pretty print.

    @params: {Integer} level, term's depth in the tree.
*/
RegExpQuantifier.prototype.pp = function(level)
{
    return genLevel(level) + "Quantifier (min " + this.min + ", max " + (this.max === -1 ? "inf" : this.max) + ")\n";
}

/**
    Parse quantifier from current character.
*/
RegExpParser.prototype.parseQuantifier = function ()
{
    var node = new RegExpQuantifier();

    switch (this.current())
    {
        case 42: // '*'
        node.min = 0;
        node.max = -1;
        this.advance();
        break;

        case 43: // '+'
        node.min = 1;
        node.max = -1;
        this.advance();
        break;

        case 63: // '?'
        node.min = 0;
        node.max = 1;
        this.advance();
        break;

        case 123: // '{'
        this.advance();
        // Parse min limit.
        if (this.current() >= 48 && this.current() <= 57) // 0-9
        {
            node.min = this.parseDecimalDigit();
        }
        else
        {
            this.error("ill formed quantifier");
        }

        if (this.current() === 44) // ','
        {
            this.advance();

            if (this.current() >= 48 && this.current() <= 57)
            {             
                node.max = this.parseDecimalDigit();
            }
            else
            {
                node.max = -1; // infinity
            }
        }
        else
        {
            node.max = node.min;
        } 

        // Should be closing }
        if (this.current() === 125)
        {
            this.advance();
        }
        else
        {
            this.error("ill formed quantifier");
        }
        break;
    }

    // Is the quantifier non greedy ?
    if (this.current() === 63) // '?'
    {
        this.advance();
        node.greedy = false;
    }
    return node;
}

/**
    Atom ::
        PatternCharacter
        .
        \ AtomEscape
        CharacterClass
        ( Disjunction )
        (?: Disjunction )

    @params: {Integer, RegExpDisjunction, RegExpAssertion} value 
*/
function RegExpAtom(
    value
)
{
    this.value = value;
}

/**
    Atom pretty print.

    @params: {Integer} level, atom's depth in the tree.
*/
RegExpAtom.prototype.pp = function (
    level
)
{
    return genLevel(level) + "Atom\n" + this.value.pp(level + 1);
}

/**
    PatternCharacter

    @params: {Integer} value, character code.
*/
function RegExpPatternCharacter(
    value
)
{
    this.value = value;
}

/**
   PatternCharacter pretty print. 
*/
RegExpPatternCharacter.prototype.pp = function (
    level
)
{
    return genLevel(level) + "PatternCharacter " + this.value + "\n";
}

/**
    BackReference
*/
function RegExpBackReference (
    index
)
{
    this.index = index;
}

/**
   BackReference pretty print. 
*/
RegExpBackReference.prototype.pp = function (
    level
)
{
    return genLevel(level) + "BackReference : " + this.index + "\n";
}

function RegExpControlSequence (
    value
)
{
    this.value = value;
}

RegExpControlSequence.prototype.pp = function (
    level
)
{
    return genLevel(level) + "ControlSequence : " + this.value + "\n";
}

RegExpParser.prototype.parseAtomEscape = function ()
{
    var cc;

    if (this.current() >= 48 && this.current() <= 57)
    {
        return new RegExpBackReference( this.parseDecimalDigit() );
    }
    else
    {
        switch (this.current())
        {
            case 100: // 'd'
            case 68: // 'D'
            // Decimal digits class.
            cc = new RegExpCharacterClass(this.current() === 100);
            this.advance();
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(48), new RegExpPatternCharacter(57)));
            return cc;

            case 115: // 's'
            case 83: // 'S'
            cc = new RegExpCharacterClass(this.current() === 115);
            this.advance();
            // Whitespace characters.
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(9)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(11)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(12)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(32)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(160)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(65279)));
            // Line terminator characters.
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(10)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(13)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(8232)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(8233)));
            return cc;

            case 119: // 'w'
            case 87: // 'W'
            cc = new RegExpCharacterClass(this.current() === 119);
            this.advance();
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(65), new RegExpPatternCharacter(90)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(97), new RegExpPatternCharacter(122)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(48), new RegExpPatternCharacter(57)));
            cc.classAtoms.push(new RegExpClassAtom(new RegExpPatternCharacter(95)));
            return cc;

            case 99: // 'c'
            // Parse control sequence.
            this.advance();
            if ((this.current() >= 65 && this.current() <= 90) || // A-Z
                (this.current() >= 97 && this.current() <= 122)) // a-z
            {
                var c = this.current();
                this.advance();
                return new RegExpControlSequence(new RegExpPatternCharacter(c));
            } 
            else
            {
                this.error("invalid control sequence");
            }
            return node;

            case 120: // 'x'
            // Parse hexadecimal sequence.
            this.advance();
            return new RegExpPatternCharacter(this.parseHexadecimalSequence(2));

            case 117: // 'u'
            // Parse unicode hexadecimal sequence.
            this.advance();
            return new RegExpPatternCharacter(this.parseHexadecimalSequence(4));

            case 116: // 't'
            this.advance();
            return new RegExpPatternCharacter(9); // Tabulation

            case 110: // 'n'
            this.advance();
            return new RegExpPatternCharacter(10); // Line terminator

            case 118: // 'v'
            this.advance();
            return new RegExpPatternCharacter(11);

            case 102: // 'f'
            this.advance();
            return new RegExpPatternCharacter(12);

            case 114: // 'r'
            this.advance();
            return new RegExpPatternCharacter(13);

            default:
            var c = this.current();
            this.advance();
            return new RegExpPatternCharacter(c);
        }
    }
}

/**
    Parse an hexadecimal sequence of <size> characters and
    returns its decimal value.
*/
RegExpParser.prototype.parseHexadecimalSequence = function (
    size
)
{
    var value = 0;

    while (size-- > 0)
    {
        if (this.current() >= 48 && this.current() <= 57) // 0-9
        {
           value = value * 16 + (this.current() - 48); 
        }
        else if (this.current() >= 65 && this.current() <= 70) // A-F
        {
           value = value * 16 + (this.current() - 55); 
        }
        else if (this.current() >= 97 && this.current() <= 102) // a-f
        {
           value = value * 16 + (this.current() - 87); 
        }
        else
        {
            this.error("invalid hexadecimal sequence");
        }
        this.advance();
    }

    return value;
}

/**
    CharacterClass
*/
function RegExpCharacterClass (
    positive
)
{
    this.classAtoms = [];
    this.positive = positive;
}

RegExpCharacterClass.prototype.pp = function (level)
{
    var s = genLevel(level) + "CharacterClass " + (this.positive ? "inclusive" : "exclusive") + "\n";

    for (var i = 0; i < this.classAtoms.length; ++i)
        s += this.classAtoms[i].pp(level + 1);
    return s;
}

RegExpParser.prototype.parseCharacterClass = function ()
{
    var node = new RegExpCharacterClass(true);

    this.advance(); // consume [

    if (this.current() === 94) // '^'
    {
        // Set the character class type to exclusive if it starts with [^
        this.advance();
        node.positive = false;
    }

    while (true)
    {
        switch (this.current())
        {
            case null: // EOL
            this.error("unclosed character class");
            return node;

            case 93: // ']'
            this.advance();
            return node;

            default:
            node.classAtoms.push(this.parseClassAtom());
        }
    }
}

function RegExpClassAtom (
    min,
    max
)
{
    this.min = min;
    this.max = max;
}

/**
    ClassAtom pretty print.
*/
RegExpClassAtom.prototype.pp = function (level)
{
    var s = genLevel(level) + "ClassAtom\n";

    if (this.min === undefined)
        s += "all\n";
    else
        s += this.min.pp(level + 1);
    if (this.max !== undefined)
        s += this.max.pp(level + 1);
    return s;
}

RegExpParser.prototype.parseClassAtom = function ()
{
    var node = new RegExpClassAtom();

    switch (this.current())
    {
        case 92: // '\'
        this.advance();
        node.min = this.parseAtomEscape();
        break;

        case 93: // ']'
        break;

        default:
        node.min = new RegExpPatternCharacter(this.current());
        this.advance();
    }

    if (this.current() === 45) // '-'
    {
        this.advance();
        switch (this.current())
        {
            case 92: // '\'
            this.advance();
            node.max = this.parseAtomEscape();
            break;

            case 93: // ']'
            break;

            default:
            node.max = new RegExpPatternCharacter(this.current());
            this.advance();
        }
    }
    return node;
}

RegExpParser.prototype.parseDecimalDigit = function ()
{
    var value = 0;

    while (this.current() >= 48 && this.current() <= 57) // 0-9
    {
       value = (value * 10) + this.current() - 48; 
       this.advance();
    }
    return value;
}

/**
    Generate level string for pretty print.
*/
function genLevel (
    level
)
{
    var s = "";

    for (var i = 0; i < level; i++)
        s += " | ";
    if (level > 0)
        s += " ";
    return s;
}


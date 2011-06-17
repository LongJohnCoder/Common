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
Implementation of ECMAScript 5 Date methods and prototype.

@author
Maxime Chevalier-Boisvert

@copyright
Copyright (c) 2011 Tachyon Javascript Engine, All Rights Reserved
*/

/**
15.9.3 The Date function/constructor
new Date ([year [, month [, date [, hours [, minutes [, seconds [, ms]]]]]]])
new Date ()
Date ([year [, month [, date [, hours [, minutes [, seconds [, ms]]]]]]])
Date()
*/
function Date()
{
    // TODO
}

/**
15.9.4.1 The Date prototype object
*/
Date.prototype = {};

/**
15.9.5.1 Date.prototype.constructor
*/
Date.prototype.constructor = Date;

//-----------------------------------------------------------------------------

// TODO:
//15.9.4.2 Date.parse (string)
//15.9.4.3 Date.UTC(year, month [, date [, hours [, minutes [, seconds [, ms]]]]])
//15.9.4.4 Date.now()

// TODO:
//15.9.5.2 Date.prototype.toString()
//15.9.5.3 Date.prototype.toDateString()
//15.9.5.4 Date.prototype.toTimeString()
//15.9.5.5 Date.prototype.toLocaleString()
//15.9.5.6 Date.prototype.toLocaleDateString()
//15.9.5.7 Date.prototype.toLocaleTimeString()
//15.9.5.8 Date.prototype.valueOf()

//15.9.5.9 Date.prototype.getTime()
Date.prototype.getTime = function ()
{
    return currentTimeMillis();
};

//15.9.5.10 Date.prototype.getFullYear()
//15.9.5.11 Date.prototype.getUTCFullYear()
//15.9.5.12 Date.prototype.getMonth()
//15.9.5.13 Date.prototype.getUTCMonth()
//15.9.5.14 Date.prototype.getDate()
//15.9.5.15 Date.prototype.getUTCDate()
//15.9.5.16 Date.prototype.getDay()
//15.9.5.17 Date.prototype.getUTCDay()
//15.9.5.18 Date.prototype.getHours()
//15.9.5.19 Date.prototype.getUTCHours()
//15.9.5.20 Date.prototype.getMinutes()
//15.9.5.21 Date.prototype.getUTCMinutes()
//15.9.5.22 Date.prototype.getSeconds()
//15.9.5.23 Date.prototype.getUTCSeconds()
//15.9.5.24 Date.prototype.getMilliseconds()
//15.9.5.25 Date.prototype.getUTCMilliseconds()
//15.9.5.26 Date.prototype.getTimezoneOffset()
//15.9.5.27 Date.prototype.setTime (time)
//15.9.5.28 Date.prototype.setMilliseconds (ms)
//15.9.5.29 Date.prototype.setUTCMilliseconds (ms)
//15.9.5.30 Date.prototype.setSeconds (sec [, ms])
//15.9.5.31 Date.prototype.setUTCSeconds (sec [, ms])
//15.9.5.32 Date.prototype.setMinutes (min [, sec [, ms]])
//15.9.5.33 Date.prototype.setUTCMinutes (min [, sec [, ms]])
//15.9.5.34 Date.prototype.setHours (hour [, min [, sec [, ms]]])
//15.9.5.35 Date.prototype.setUTCHours (hour [, min [, sec [, ms]]])
//15.9.5.36 Date.prototype.setDate (date)
//15.9.5.37 Date.prototype.setUTCDate (date)
//15.9.5.38 Date.prototype.setMonth (month [, date])
//15.9.5.39 Date.prototype.setUTCMonth (month [, date])
//15.9.5.40 Date.prototype.setFullYear (year [, month [, date]])
//15.9.5.41 Date.prototype.setUTCFullYear (year [, month [, date]])
//15.9.5.42 Date.prototype.toUTCString()
//15.9.5.43 Date.prototype.toISOString()
//15.9.5.44 Date.prototype.toJSON(key)


/**
@fileOverview
Implementation of string operations.

@author
Maxime Chevalier-Boisvert

@copyright
Copyright (c) 2010 Maxime Chevalier-Boisvert, All Rights Reserved
*/

// TODO: stare at IR, look for errors...

/**
Allocate and initialize the string table, used for hash consing
*/
function initStrTable()
{
    "tachyon:static";

    // Allocate the string table object
    var strtbl = alloc_strtbl(STR_TBL_INIT_SIZE);

    // Initialize the hash table size and number of properties
    set_strtbl_tblsize(strtbl, STR_TBL_INIT_SIZE);
    set_strtbl_numstrs(strtbl, iir.constant(IRType.i32, 0));

    // Initialize the string table
    for (
        var i = iir.constant(IRType.pint, 0); 
        i < STR_TBL_INIT_SIZE; 
        i += iir.constant(IRType.pint, 1)
    )
    {
        set_strtbl_tbl(strtbl, i, UNDEFINED);
    }


    // Get a pointer to the context
    var ctx = iir.get_ctx();

    // Set the string table reference in the context
    set_ctx_strtbl(strtbl);
}

/**
Compare two raw UTF-16 strings by iterating over 16 bit code units
This conforms to section 11.8.5 of the ECMAScript 262 specification
NOTE: this is also used to find strings in the hash consing table
*/
function strcmp(str1, str2)
{
    "tachyon:arg str1 rptr";
    "tachyon:arg str2 rptr";
    "tachyon:ret pint";

    // For each character to be compared
    for (;;)
    {
        var ch1 = iir.load(IRType.u16, str1, iir.constant(IRType.pint, 0));
        var ch2 = iir.load(IRType.u16, str1, iir.constant(IRType.pint, 0));

        if (ch1 < ch2)
            return iir.icast(IRType.pint, -1);
        else if (ch1 > ch2)
            return iir.constant(IRType.pint, 1);
        
        if (ch1 == iir.constant(IRType.u16, 0))
            break;

        str1 += iir.constant(IRType.pint, 2);
        str2 += iir.constant(IRType.pint, 2);
    }

    // The strings are equal
    return iir.constant(IRType.pint, 0);
}

/**
Allocate/get a reference to a string object containing the given string data
@param strData pointer to raw UTF-16 string data
*/
function getStrObj(strData, strLen)
{
    "tachyon:static";
    "tachyon:arg strData rptr";
    "tachyon:arg strLen pint";

    //
    // TODO: maintain a hash set of allocated strings
    // this is needed for equality comparison by direct reference comparison
    //
    // Need:
    // mem layout of str table
    // ref to table in context object (tag other)
    // str table allocation in heapInit()
    // - initial size ~101 (prime)
    // search algorithm
    // - involves string comparison
    //
    // For now, no resizing of table




    // TODO: look for string in string table before allocating
    // TODO: define constant for raw string data offset?




    // Allocate a string object
    var strObj = alloc_str(strLen);

    // Set the string length in the string object
    set_str_len(strObj, strLen);

    // Initialize the hash code to 0
    var hashCode = iir.constant(IRType.pint, 0);

    // For each character, update the hash code
    for (
        var index = iir.constant(IRType.pint, 0); 
        true;
        index = index + iir.constant(IRType.pint, 1)
    )
    {
        // Get the current character
        var ch = iir.load(IRType.u16, strData, index);

        // Copy the character into the string object
        set_str_data(strObj, index, ch);

        // Convert the character value to the pint type
        var ch = iir.icast(IRType.pint, ch);

        // If this is the null terminator, break out of the loop
        if (ch == iir.constant(IRType.pint, 0))
            break;

        // Update 
        hashCode =
            (hashCode * iir.constant(IRType.pint, 256) + ch) %
            iir.constant(IRType.pint, 426870919);
    }

    // Set the hash code in the string object
    set_str_hash(strObj, iir.icast(IRType.i32, hashCode));

    // Return a reference to the string object
    return strObj;
}


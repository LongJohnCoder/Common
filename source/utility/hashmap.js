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
Implementation of a hash map data structure.

@author
Maxime Chevalier-Boisvert

@copyright
Copyright (c) 2010 Maxime Chevalier-Boisvert, All Rights Reserved
*/

/**
Default hash function implementation
*/
function defHashFunc(val)
{
    if (typeof val === 'number')
    {
        return Math.floor(val);
    }

    else if (typeof val === 'string')  
    {
        var hashCode = 0;

        for (var i = 0; i < val.length; ++i)
        {
            var ch = val.charCodeAt(i);
            hashCode = (((hashCode << 8) + ch) & 536870911) % 426870919;
        }

        return hashCode;
    }

    else if (typeof val === 'boolean')
    {
        return val? 1:0;
    }

    else if (val === null || val === undefined)
    {
        return 0;
    }

    else
    {
        if (!val.hasOwnProperty('__hashCode__'))
        {
            val.__hashCode__ = defHashFunc.nextObjectSerial++;
        }

        return val.__hashCode__;
    }
}

/**
Next object serial number to be assigned
*/
defHashFunc.nextObjectSerial = 1;

/**
Default equality function
*/
function defEqualFunc(key1, key2)
{
    return key1 === key2;
}

// Default initial hash map size
HashMap.DEFAULT_INIT_SIZE = 89;

// Hash map min and max load factors
HashMap.MIN_LOAD_NUM = 1;
HashMap.MIN_LOAD_DENOM = 10;
HashMap.MAX_LOAD_NUM = 6;
HashMap.MAX_LOAD_DENOM = 10;

// Key value for free hash table slots
HashMap.FREE_KEY = {};

// Value returned for not found items
HashMap.NOT_FOUND = {};

/**
@class Hash map implementation
*/
function HashMap(hashFunc, equalFunc, initSize)
{
    // If no hash function was specified, use the default function
    if (hashFunc === undefined || hashFunc === null)
        hashFunc = defHashFunc;

    // If no hash function was specified, use the default function
    if (equalFunc === undefined || equalFunc === null)
        equalFunc = defEqualFunc;

    if (initSize === undefined)
        initSize = HashMap.DEFAULT_INIT_SIZE;

    /**
    Initial size of this hash map
    @field
    */
    this.initSize = initSize;

    /**
    Number of internal array slots
    @field
    */
    this.numSlots = initSize;

    /**
    Internal storage array
    @field
    */
    this.array = [];

    // Set the initial array size
    this.array.length = 2 * this.numSlots;

    // Initialize each array element
    for (var i = 0; i < this.numSlots; ++i)
        this.array[2 * i] = HashMap.FREE_KEY;

    /**
    Number of items stored
    @field
    */
    this.length = 0;

    /**
    Hash function
    @field
    */
    this.hashFunc = hashFunc;

    /**
    Key equality function
    @field
    */
    this.equalFunc = equalFunc;
}

/**
Add or change a key-value binding in the map
*/
HashMap.prototype.set = function (key, value)
{
    var index = 2 * (this.hashFunc(key) % this.numSlots);

    // Until a free cell is found
    while (this.array[index] !== HashMap.FREE_KEY)
    {
        // If this slot has the item we want
        if (this.equalFunc(this.array[index], key))
        {
            // Set the item's value
            this.array[index + 1] = value;

            // Exit the function
            return;
        }

        index = (index + 2) % this.array.length;
    }

    // Insert the new item at the free slot
    this.array[index] = key;
    this.array[index + 1] = value;

    // Increment the number of items stored
    this.length++;

    // Test if resizing of the hash map is needed
    // length > ratio * numSlots
    // length > num/denom * numSlots 
    // length * denom > numSlots * num
    if (this.length * HashMap.MAX_LOAD_DENOM >
        this.numSlots * HashMap.MAX_LOAD_NUM)
    {
        this.resize(2 * this.numSlots + 1);
    }
};

/**
Remove an item from the map
*/
HashMap.prototype.rem = function (key)
{    
    var index = 2 * (this.hashFunc(key) % this.numSlots);

    // Until a free cell is found
    while (this.array[index] !== HashMap.FREE_KEY)
    {
        // If this slot has the item we want
        if (this.equalFunc(this.array[index], key))
        {
            // Initialize the current free index to the removed item index
            var curFreeIndex = index;

            // For every subsequent item, until we encounter a free slot
            for (var shiftIndex = (index + 2) % this.array.length;
                this.array[shiftIndex] !== HashMap.FREE_KEY;
                shiftIndex = (shiftIndex + 2) % this.array.length)
            {
                // Calculate the index at which this item's hash key maps
                var origIndex = 2 * (this.hashFunc(this.array[shiftIndex]) % this.numSlots);

                // Compute the distance from the element to its origin mapping
                var distToOrig =
                    (shiftIndex < origIndex)? 
                    (shiftIndex + this.array.length - origIndex):
                    (shiftIndex - origIndex);

                // Compute the distance from the element to the current free index
                var distToFree =
                    (shiftIndex < curFreeIndex)?
                    (shiftIndex + this.array.length - curFreeIndex):
                    (shiftIndex - curFreeIndex);                    

                // If the free slot is between the element and its origin
                if (distToFree <= distToOrig)
                {
                    // Move the item into the free slot
                    this.array[curFreeIndex] = this.array[shiftIndex];
                    this.array[curFreeIndex + 1] = this.array[shiftIndex + 1];

                    // Update the current free index
                    curFreeIndex = shiftIndex;
                }
            }

            // Clear the hash key at the current free position
            this.array[curFreeIndex] = HashMap.FREE_KEY;

            // Decrement the number of items stored
            this.length--;

            // If we are under the minimum load factor, shrink the internal array
            // length < ratio * numSlots 
            // length < num/denom * numSlots 
            // length * denom < numSlots * num
            if ((this.length * HashMap.MIN_LOAD_DENOM <
                 this.numSlots * HashMap.MIN_LOAD_NUM)
                &&
                this.numSlots > this.initSize)
            {
                this.resize((this.numSlots - 1) >> 1);
            }

            // Item removed
            return;
        }

        index = (index + 2) % this.array.length;
    }
};

/**
Get an item in the map
*/
HashMap.prototype.get = function (key)
{
    var index = 2 * (this.hashFunc(key) % this.numSlots);

    // Until a free cell is found
    while (this.array[index] !== HashMap.FREE_KEY)
    {
        // If this slot has the item we want
        if (this.equalFunc(this.array[index], key))
        {
            // Return the item's value
            return this.array[index + 1];
        }

        index = (index + 2) % this.array.length;
    }

    // Return the special not found value
    return HashMap.NOT_FOUND;
};

/**
Test if an item is in the map
*/
HashMap.prototype.has = function (key)
{
    return (this.get(key) !== HashMap.NOT_FOUND);
};

/**
Get the keys present in the hash map
*/
HashMap.prototype.getKeys = function ()
{
    var keys = [];

    for (var i = 0; i < this.numSlots; ++i)
    {
        var index = 2 * i;

        if (this.array[index] !== HashMap.FREE_KEY)
            keys.push(this.array[index]);
    }

    return keys;
};

/**
Get an iterator for this hash map
*/
HashMap.prototype.getItr = function ()
{
    return new HashMap.Iterator(this, 0);
};

/**
Erase all contained items
*/
HashMap.prototype.clear = function ()
{
    // Set the initial number of slots
    this.numSlots = this.initSize;

    // Set the initial array size
    this.array.length = 2 * this.numSlots;

    // Reset each array key element
    for (var i = 0; i < this.numSlots; ++i)
        this.array[2 * i] = HashMap.FREE_KEY;

    // Reset the number of items stored
    this.length = 0;
};

/**
Copy the map
*/
HashMap.prototype.copy = function ()
{
    var newMap = new HashMap(this.hashFunc, this.equalFunc);

    newMap.numSlots = this.numSlots;
    newMap.array = this.array.slice(0);
    newMap.length = this.length;

    return newMap;
};

/**
Resize the hash map's internal storage
*/
HashMap.prototype.resize = function (newSize)
{
    // Ensure that the new size is valid
    assert (
        this.length <= newSize && Math.floor(newSize) === newSize,
        'cannot resize, more items than new size allows'
    );

    var oldNumSlots = this.numSlots;
    var oldArray = this.array;

    // Initialize a new internal array
    this.array = [];
    this.numSlots = newSize;
    this.array.length = 2 * this.numSlots;
    for (var i = 0; i < this.numSlots; ++i)
        this.array[2 * i] = HashMap.FREE_KEY;

    // Reset the number of elements stored
    this.length = 0;

    // Re-insert the elements from the old array
    for (var i = 0; i < oldNumSlots; ++i)
        if (oldArray[2 * i] !== HashMap.FREE_KEY)
            this.set(oldArray[2 * i], oldArray[2 * i + 1]);     
};

/**
@class Hash map iterator
*/
HashMap.Iterator = function (hashMap, slotIndex)
{
    /**
    Associated hash map
    @field
    */
    this.map = hashMap;

    /**
    Current hash map slot
    @field
    */
    this.index = slotIndex;

    // Move to the next non-free slot
    this.nextFullSlot();
};
HashMap.Iterator.prototype = {};

/**
Move the current index to the next non-free slot
*/
HashMap.Iterator.prototype.nextFullSlot = function ()
{
    while (
        this.index < this.map.array.length &&
        this.map.array[this.index] === HashMap.FREE_KEY
    )
        this.index += 2;
};

/**
Test if the iterator is at a valid position
*/
HashMap.Iterator.prototype.valid = function ()
{
    return (this.index < this.map.array.length);
};

/**
Move to the next list item
*/
HashMap.Iterator.prototype.next = function ()
{
    assert (
        this.valid(),
        'cannot move to next list item, iterator not valid'
    );

    // Move to the next slot
    this.index += 2;

    // Move to the first non-free slot found
    this.nextFullSlot();
};

/**
Get the current list item
*/
HashMap.Iterator.prototype.get = function ()
{
    assert (
        this.valid(),
        'cannot get current list item, iterator not valid'
    );

    return { 
        key: this.map.array[this.index],  
        value: this.map.array[this.index + 1] 
    };
};


export * from "./exercises";
export * from "./splits";
export * from "./workouts";

/* We use local storage now.
Every function under storage follows the same pattern read the entire array from AsyncStorage, modify it in memory, write the entire array back.

AsyncStorage is a simple persistent key-value store (identical to HashMap<String, String> in Java). 
The keys are constant strings like @quietrep/exercises, and the values are always strings. 
It has no concept of types, nested structures, arrays, or objects, just strings mapped to strings, 
persisted to the device's local storage so it survives app restarts.

Because everything going in and coming out is a plain string, you have to do the conversion yourself both ways:
- Writing: convert your JavaScript array/object -> JSON string via JSON.stringify() before storing
- Reading: convert the JSON string -> JavaScript array/object via JSON.parse() before using

Functions:
- getX parse that JSON string back into a real array. If nothing is stored yet they return an empty array rather than crashing.
- addX spread the new item into the existing array. The ...data spread copies all the fields from the argument, then id: uuid() adds the generated id on top.
- updateX use .map() — they loop over every item, and for the one whose id matches, they replace it with the updated version. Everything else passes through unchanged.
- deleteX use .filter() — they keep everything except the item with the matching id.
*/

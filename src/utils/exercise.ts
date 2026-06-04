import { Exercise } from "@/types";

// Returns true if every word in the search query partially matches at least one word in the exercise name.
// e.g. "inc ben" matches "Incline Bench Press" because "inc" matches "Incline" and "ben" matches "Bench".
export function matchesSearchQuery(exercise: Exercise, searchQuery: string): boolean {
  const queryWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return true; // empty queries returns true => match all exercises

  const nameWords: string[] = exercise.name.toLowerCase().split(/\s+/);

  return queryWords.every((queryWord) =>
    nameWords.some((nameWord) => nameWord.startsWith(queryWord))
  );
}

/*
/\s+/ is a regular expression. 
\s matches any whitespace character (space, tab, etc.) and + means "one or more". 
So split(/\s+/) splits on any contiguous run of whitespace, not just a single space.
This ensures that we do not leave empty strings or strings of whitespaces in queryWords

filter(Boolean)
Boolean(value) returns true for truthy values and false for falsy ones ("", null, undefined, 0, etc.).
Passing it to .filter() removes all falsy elements from the array. 
The main case it guards against here: searchQuery is "" or "   ", after .trim() you get "", 
and "".split(/\s+/) returns [""] — an array with one empty string. 
filter(Boolean) removes that, leaving [], so the queryWords.length === 0 check fires 
and we return true (match all).
*/
import assert from "assert";

import type { Hire, StableMatcher, StableMatcherWithTrace, Offer } from "../include/stableMatching.js";

export function generateInput(n: number): number[][] {
  const arr = create2DArray(n);

  return shuffleArray(arr, n);
}

//fisher yates: shuffle
export function shuffleArray(arr: number[][], n: number): number[][] {
  for (let i = 0; i < n; i++) {
    for (let k = arr.length - 1; k > 0; k--) {
      const j = randomInt(0, k);
      [arr[i][k], arr[i][j]] = [arr[i][j], arr[i][k]];
    }
  }
  return arr;
}

//creates an 2D array that contains an array that iterates each new value
export function create2DArray(n: number): number[][] {
  //creates array of length n
  const array: number[][] = [];
  //iterates through array and places an array inside that is all zeros
  for (let i = 0; i < n; i++) {
    array[i] = new Array<number>(n).fill(0);
    //replaces zeros with increasing values (exp: 0, 1, 2, 3)
    for (let j = 0; j < n; j++) {
      array[i][j] = j;
    }
  }
  return array;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

const NUM_TESTS = 5; // Change this to some reasonably large value
const N = 6; // Change this to some reasonable size

/**
 * Tests whether or not the supplied function is a solution to the stable matching problem.
 * @param makeStableMatching A possible solution to the stable matching problem
 * @throws An `AssertionError` if `makeStableMatching` in not a solution to the stable matching problem
 */
function stableMatch(hires: Hire[], companies: number[][], candidates: number[][], N: number): void {
  function preferred(C: number[][], pick: number, actualPick: number): number[] {
    let i = 0;
    //Grabs candidates a CompanyX would have preferred
    while (C[pick][i] !== actualPick) {
      i++;
    }
    return C[pick].slice(0, i);
  }
  //searches hires for a particular candidate and returns what company they were matched with
  function searchPairing(preferredCandidate: number): number {
    let j = 0;
    while (hires[j].candidate !== preferredCandidate) {
      j++;
    }
    //store company preferredCandidate is with
    return hires[j].company;
  }
  for (let x = 0; x < N; x++) {
    //pairings
    //CompanyX we are looking at:
    const CompanyX = hires[x].company;
    //Candidate: that was matched with CompanyX
    const hiredCandidate = hires[x].candidate;

    //returns all candidates CompanyX wanted over actual candidate
    const preferredCandidatesX = preferred(companies, CompanyX, hiredCandidate);

    //iterates through CompanyX's preferredCandidates until it finds a candidate that preferred CompanyX offer their pair
    preferredCandidatesX.forEach(preferredCandidateX => {
      //iterates through list of hires until it finds what company preferredCandidate ended up with
      const CompanyY = searchPairing(preferredCandidateX);

      //returns companies preferredCandidate would have preferred over their actual match
      const CandidateXPreferredCompanies = preferred(candidates, preferredCandidateX, CompanyY);

      //if True it is not a stable match
      if (CandidateXPreferredCompanies.includes(CompanyX)) {
        return assert(false, "unstable match");
      }
    });
  }
}
function checkDuplicateCandidates(hires: Hire[]): boolean {
  //turns hires into an array of just candidates
  const array = new Array(hires.length);
  for (let x = 0; x < hires.length - 1; ++x) {
    array[x] = hires[x].candidate;
  }
  //set removes duplicates: if there were duplicates sizes won't match
  const unDuplicatedSet = new Set(array).size;

  return unDuplicatedSet === hires.length;
}

function checkMissingCandidates(hires: Hire[], N: number): boolean {
  for (let x = 0; x < hires.length - 1; ++x) {
    if (0 > hires[x].candidate && hires[x].candidate > N - 1) {
      return false;
    }
  }
  return true;
}

export function stableMatchingOracle(makeStableMatching: StableMatcher): void {
  //return new Set(array).size !== array.length;

  //return true;
  for (let i = 0; i < NUM_TESTS; ++i) {
    const companies = generateInput(N);
    console.log("Company Picks: ", companies);
    const candidates = generateInput(N);
    console.log("Candidate Picks: ", candidates);
    const hires = makeStableMatching(companies, candidates);
    console.log("Pairings", hires);

    assert(companies.length === hires.length, "Hires length is correct.");

    assert(candidates.length === hires.length, "Hires length is correct. (candidates)");

    assert(checkDuplicateCandidates(hires), "No duplicate Candidates");

    assert(checkMissingCandidates(hires, N), "All companies hire candidates");

    stableMatch(hires, companies, candidates, N);
  }
}

// Part B

/**
 * Tests whether or not the supplied function follows the supplied algorithm.
 * @param makeStableMatchingTrace A possible solution to the stable matching problem and its possible steps
 * @throws An `AssertionError` if `makeStableMatchingTrace` does not follow the specified algorithm, or its steps (trace)
 * do not match with the result (out).
 */

class C {
  preferences: number[];
  Match: number;
  proposals: number[];
  index: number;

  constructor(preferences: number[], index: number) {
    this.preferences = preferences;
    this.Match = -1;
    this.proposals = [];
    this.index = index;
  }

  receiveProposal(ProposerIndex: number, C: C[]): boolean {
    // Check if the candidate is already matched
    if (this.Match !== -1) {
      // If matched, check if the new proposal is better than the current match
      const currentMatchPreferenceIndex = this.preferences.indexOf(this.Match);
      const newMatchPreferenceIndex = this.preferences.indexOf(ProposerIndex);
      if (newMatchPreferenceIndex < currentMatchPreferenceIndex) {
        // If the new proposal is better, update the previous match and return true
        const prevMatch = C[this.Match];
        prevMatch.Match = -1;
        // If the new proposal is better, update the match and return true
        this.Match = ProposerIndex;
        return true;
      } else {
        return false;
      }
    } else {
      // If the candidate is not matched, accept the proposal
      this.Match = ProposerIndex;
      return true;
    }
  }
  isMatch() {
    return this.Match;
  }
}

function preferencesObject(CompCan: number[][]) {
  return CompCan.map((x, y) => new C(x, y));
}

function forceMatch(ProposerObj: C, proposed: number) {
  ProposerObj.Match = proposed;
}

function storeProposals(offers: Offer[], companies: C[], candidates: C[]): void {
  //iterates through offers
  for (let x = 0; x < offers.length; x++) {
    //Proposer number
    const Proposer = offers[x].from;
    //Proposed number
    const Proposed = offers[x].to;

    //makes sure proposal information ends up in correct object
    if (offers[x].fromCo) {
      //grabs correct object
      const ProposerObj = companies[Proposer];
      //pushes Proposer companies proposed candidate into their proposals
      ProposerObj.proposals.push(Proposed);

      //stores proposed object
      const ProposedObj = candidates[Proposed];

      const forceMatchbool = ProposedObj.receiveProposal(Proposer, companies);
      if (forceMatchbool) {
        forceMatch(ProposerObj, Proposed);
      }
    }
    //makes sure proposal information ends up in correct object
    else {
      //grabs correct object
      const ProposerObj = candidates[Proposer];
      //pushes Proposer companies proposed candidate into their proposals
      ProposerObj.proposals.push(Proposed);

      const ProposedObj = companies[Proposed];

      const forceMatchbool = ProposedObj.receiveProposal(Proposer, candidates);
      if (forceMatchbool) {
        forceMatch(ProposerObj, Proposed);
      }
    }
  }
}

function ifArraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function CheckProposals(out: Hire[], companies: number[][], candidates: number[][], trace: Offer[]) {
  //creates a list of objects that represents the companies and their preferences
  const companyObj = preferencesObject(companies);
  const candidateObj = preferencesObject(candidates);

  storeProposals(trace, companyObj, candidateObj);

  checkMatches(out, companyObj, candidateObj);

  //iterate through objects
  for (let x = 0; x < companyObj.length; x++) {
    //grabs company object lists of proposals
    const listProposals = companyObj[x].proposals;

    //grabs companyObj list of preferences
    const listPreferences = companyObj[x].preferences;

    //checks if Proposals List is longer
    if (listProposals.length > listPreferences.length)
      return assert(false, "Proposals List is longer: meaning duplicates"); //- [ASSERTION] stableMatchingRunOracle accepts STABLE_MATCHING_SOLUTION_8_TRACE (0/6.1)

    //checks for duplicates
    if (new Set(listProposals).size !== listProposals.length) return assert(false, "duplicates");

    //splices listPreferences to be same length as listProposals
    const reducedPreferences = listPreferences.length - (listPreferences.length - listProposals.length);
    const checkPreferences = listPreferences.splice(0, reducedPreferences);

    //checks if Proposals not approached in order of preferences
    if (!ifArraysEqual(checkPreferences, listProposals))
      return assert(false, "Proposals not approached in order of preferences"); //perfect
  }
}

function checkMatches(out: Hire[], companies: C[], candidates: C[]): boolean {
  //console.log("CheckMatchOutput", out);
  for (let x = 0; x < out.length; x++) {
    const companyIndex = out[x].company;
    const candidateIndex = out[x].candidate;

    const company = companies[companyIndex];
    const candidate = candidates[candidateIndex];

    //Check if the matches in the companies and candidates align with the 'out' pair
    if (company.Match !== candidateIndex || candidate.Match !== companyIndex) {
      assert(false, "Mismatch found"); // New and fixed try it out
    }
  }

  return true; // All matches are valid
}

export function stableMatchingRunOracle(makeStableMatchingTrace: StableMatcherWithTrace): void {
  for (let i = 0; i < NUM_TESTS; ++i) {
    const GenerateCompanies = generateInput(N);
    const GenerateCandidates = generateInput(N);
    const { trace, out } = makeStableMatchingTrace(GenerateCompanies, GenerateCandidates);
    console.log("Company Picks", GenerateCompanies);
    console.log("Candidate Picks", GenerateCandidates);
    console.log("Trace:", trace);
    console.log("Output:", out);

    assert(checkDuplicateCandidates(out), "No duplicate Candidates"); //[ASSERTION] stableMatchingRunOracle accepts STABLE_MATCHING_SOLUTION_8_TRACE (0/6.1)

    assert(checkMissingCandidates(out, N), "All companies hire candidates");

    //makes sure companies that already matches do not propose
    //Proposals List is longer: meaning duplicates
    //checks for duplicates
    //checks if Proposals not approached in order of preferences
    //checks matches with output
    CheckProposals(out, GenerateCompanies, GenerateCandidates, trace);
  }
}

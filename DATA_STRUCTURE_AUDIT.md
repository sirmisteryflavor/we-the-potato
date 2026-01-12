# Data Structure Audit Report

## 1. CANDIDATE DATA SOURCES

### Source A: Database Schema (`candidates` table)
```
- id (string)
- electionYear (integer)
- firstName (string) ← Note: NOT "name"
- lastName (string)  ← Note: NOT "name"
- party (string)
- incumbentStatus (string, optional)
- photoUrl (string, optional)
- websiteUrl (string, optional)
- bio (string, optional)
- position (string, optional) ← Note: single value, not array
- createdAt, updatedAt
```

### Source B: Candidate Interface (components/candidate-card.tsx expects)
```
- id (string)
- name (string) ← REQUIRED: firstName + lastName combined
- party (string)
- office (string) ← REQUIRED: NOT in database
- age (number, optional)
- photoUrl (string, optional)
- positions (string[], array) ← REQUIRED: defaults to []
- experience (string) ← REQUIRED: maps to bio
- endorsements (string[], array) ← REQUIRED: defaults to []
- donations (CandidateDonations, optional)
```

## 2. IDENTIFIED MISMATCHES

| Field | Database | Interface | Status |
|-------|----------|-----------|--------|
| name | ❌ (firstName/lastName separate) | ✅ (required) | **MISMATCH** |
| firstName | ✅ | ❌ (not expected) | Unused by components |
| lastName | ✅ | ❌ (not expected) | Unused by components |
| office | ❌ | ✅ (required) | **MISSING - must add** |
| party | ✅ | ✅ | ✅ OK |
| age | ❌ | ❌ (optional) | Not collected, safe to omit |
| photoUrl | ✅ | ✅ (optional) | ✅ OK |
| positions | ❌ (have `position` singular) | ✅ (required array) | **MISMATCH** |
| experience | ❌ (have `bio`) | ✅ (required) | **MAPPING NEEDED** |
| endorsements | ❌ (separate table) | ✅ (required array) | **NEEDS TRANSFORMATION** |
| websiteUrl | ✅ | ❌ | Available but unused |

## 3. DATA FLOW PROBLEMS

### Problem 1: API Transformation
**File:** `app/api/ballot/[zipcode]/route.ts`

Current response structure:
```javascript
{
  races: [
    {
      id, office, candidates: [
        { id, firstName, lastName, party, incumbentStatus, photoUrl, ... }
      ]
    }
  ]
}
```

Expected by ballot page:
```javascript
{
  candidates: [
    { id, name, party, office, positions: [], experience: "", endorsements: [] }
  ]
}
```

**Current Fix:** `app/ballot/page.tsx` adds `positions: []` and `experience`, but this is ad-hoc.

### Problem 2: Missing Office Field
- Database races have `office` field
- API includes it in race object
- Ballot page must flatten it into each candidate object
- **Solution:** Already implemented in current transformation

### Problem 3: Nested Endorsements
- Database has `candidateEndorsements` table (separate)
- API should fetch and join them
- Currently returns array of endorsement objects, not strings
- **Solution:** Transform to string array or flatten properly

## 4. RECOMMENDED DATA STRUCTURE FIXES

### Option 1: Normalize at API Level (Recommended)
Transform `/api/ballot/[zipcode]` to return:
```javascript
{
  candidates: [
    {
      id, name, party, office, age, photoUrl,
      positions: [], // empty array from db
      experience, // from bio
      endorsements: [] // from endorsements table
    }
  ],
  measures: []
}
```

### Option 2: Create Adapter Layer
Keep API raw, create TypeScript utility to transform:
```typescript
function transformCandidateForUI(candidate: DatabaseCandidate): Candidate {
  return {
    id: candidate.id,
    name: `${candidate.firstName} ${candidate.lastName}`,
    party: candidate.party,
    office: raceOffice, // from parent race
    photoUrl: candidate.photoUrl,
    positions: [], // db doesn't track this
    experience: candidate.bio || "No bio available",
    endorsements: candidate.endorsements?.map(e => e.organization) || [],
  };
}
```

## 5. TEST COVERAGE NEEDED

### Unit Tests
- [ ] Candidate data transformation
- [ ] Field presence validation
- [ ] Type safety checks
- [ ] Optional vs required fields

### Integration Tests
- [ ] Database → API → Component flow
- [ ] Data completeness at each step
- [ ] Error handling for missing data
- [ ] Candidate card rendering

### Edge Cases
- [ ] Candidates without photo
- [ ] Candidates without bio
- [ ] Candidates without endorsements
- [ ] Missing office field
- [ ] Unicode names/special characters


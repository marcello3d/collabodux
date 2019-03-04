# Collabodux

[![CircleCI](https://circleci.com/gh/marcello3d/collabodux.svg?style=svg)](https://circleci.com/gh/marcello3d/collabodux)
[![codecov](https://codecov.io/gh/marcello3d/collabodux/branch/master/graph/badge.svg)](https://codecov.io/gh/marcello3d/collabodux)

**Experimental**

Collabodux is an idea and experimental library for realtime collaboration on
JSON structures. It is a client-oriented, declarative-functional approach to
shared application state.

## How to run examples

1. `yarn` to install everything
2. `cd packages/server && yarn start` to run server
3. `cd packages/examples && yarn start` to build and run examples as server
4. Open [http://localhost:8080/](http://localhost:8080/) in browser

## Background

It “steals” ideas from a number of projects:

- The entire state is represented as an immutable data structure (ala
  [Redux](https://redux.js.org))
- Each change is represented by a base revision and new revision (ala Git)
- Changes are applied by diffing data structures (ala
  [React](https://reactjs.org) virtual dom)
- Conflicts are resolved on the client side (ala
  [@mweststrate](https://github.com/mweststrate)'s
  “[Distributing state changes using snapshots, patches and actions](https://medium.com/@mweststrate/distributing-state-changes-using-snapshots-patches-and-actions-part-2-2f50d8363988)”)
- Data structure design can limit conflicts ([CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type))

### What makes it good:

- Easy to reason about application state because of immutable snapshots
  - Works with existing tools like [Redux](https://redux.js.org) and
    [Immer.js](https://github.com/mweststrate/immer)
- Conflict resolution is data-oriented, not action-oriented
  - Scales with data type complexity, not schema size
- Server is schema-agnostic
  - Focused on networking, authentication, and persistence
- No additional complexity for offline support (just persist snapshots)

### Limitations:

- Assumes application is built on immutable data structures
- Might not scale to high number of concurrent editors (conflict thrashing)
- All theoretical, untested in Real World™

## Architecture

Each document state snapshot is represented as an immutable JSON-like object.

### Sync

- **Server state**
  - Current revision ID (UUID)
  - Current snapshot
- **Client state**
  - Last seen revision ID
  - Last seen server snapshot
  - Current local snapshot (often equal to server snapshot)
- **Server to Client messages**
  - State
  - Patch
  - Accept
  - Reject
- **Client to Server messages**
  - Patch

1. Server sends revision ID + document state on client connect
2. When the client has an update, it calculates and sends a JSON patch to
   server with last seen revision ID
3. When the server receives a patch
   - If the revision ID does not equal current revision ID, reject
   - If the patch is invalid, reject
   - Else
     - Apply the patch and generate a new revision ID
     - Send accept with new revision ID
     - Broadcast the patches and new revision ID to other connected clients
4. When the client receives patches:
   - Compute new server snapshot from last seen server snapshot and patches
   - Three-way-merge local snapshot
   - Update last seen server revision ID and document state
   - Send patch as needed

The current implementation also includes Join and Leave messages to indicate
user presence.

#### Peer-to-peer Sync

While a server is currently used in the architecture, it maybe could work in a
peer-to-peer setting if clients can agree on revision ordering.

### Data normalization

A normalization function is used to map arbitrary JSON to document state.

This is useful for initializing default values, migrating data across versions,
and can add type safety in TypeScript.

Changes can then be synced back to the server (no server-side migration needed!).

### Three-way-merge

Syncing is agnostic to data schema, making it very easy to reason about. The
complexity is isolated to an application-specific three-way-merge function.

The three-way-merge function merges three snapshots into one:

- Base snapshot
- Local snapshot
- Server snapshot

At a conceptual level, you can think of computing two diffs: **base vs local** and
**base vs server**, then combining them.

This can be done recursively in a JSON structure by operating at each object
level. [json-diff3](https://github.com/marcello3d/json-diff3) can help.

When a "true" conflict happens (e.g. two users change a string), there are a few
options:

1. Attempt to merge the changes (works for strings, but not for enums/numbers/booleans)
2. Throw away local changes
3. Override server with local changes (and maybe provide a rollback option)
4. Pop-up a confirmation UI to the user
   - This UI could potentially operate at the snapshot-level or even field level

You could choose different options for different fields.

### Per-User Undo

If a user makes an edit from snapshot A to snapshot B and we subsequently
receive server edits (snapshot C). To undo only our own edit we effectively
want to rebase C on A.

Can we use the same three-way-merge with A and C using B as the base?

Yep!

# License

Zlib

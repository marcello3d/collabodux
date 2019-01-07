# Todos

1. Allow multiple documents/"roots"
2. Persist data to disk
3. Auto-reconnect
4. Show connection/sync status

----

- How to maintain the data schema over a long period of time
  - Versioning: kinda sorta ok
  - Everything is nullable
  - Protobuf-style approach of having long-lived integer 'tags' to describe fields
- How to persist to disk
  - When to 'checkpoint?'
- How does multi-user undo work?
- How does an string-level operational transform play with JSON Patch?
- Should we be using Immer, "true" JSON Patch, or something else?
  - Can we design the model format so that it's fairly resilient to conflicts?
- How does this play with offline?
  - Persist actions to disk---and versioned/resilient
  - Persist JSON patches to disk---cannot do retries/conflict resolution the same way 

---
trigger: always_on
description: Enforce safeguards against infinite loops in React effect hooks
---

## React useEffect Dependency Management

1. Functions that update state must be wrapped in `useCallback` with minimal dependencies.
2. Derived state must use `useMemo` with proper dependency arrays.
3. Context interactions must have clear ownership.
4. Use refs for stable references to functions, callbacks, and state.

### State Access in Async Callbacks

- **Never** attempt to capture state in closures using no-op setState calls like this:
  ```jsx
  // ANTI-PATTERN: DO NOT DO THIS
  let currentState;
  setState(prev => {
    currentState = prev;
    return prev; // No actual update
  });
  // currentState might be undefined here!
  ```

- **Instead**, use a state ref pattern for accessing latest state in async callbacks:
  ```jsx
  // Create a ref to track current state
  const stateRef = useRef(state);
  
  // Keep the ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // In async callbacks, use stateRef.current
  const handleAsync = useCallback(async () => {
    // Safe access to latest state without dependencies
    if (stateRef.current.isLoading) return;
    // Rest of function...
  }, []); // No need for state in dependencies
  ```

### Context Interaction Guidelines

- One context should own data fetching; others should only consume.
- Avoid circular dependencies between contexts.
- When using multiple data contexts, clearly define which context is responsible for loading specific data.
- Never duplicate data fetching logic between a component and its context provider.
- Use a refs pattern for setters and callbacks to avoid dependency cycles:
  ```jsx
  // Store setters in refs
  const settersRef = useRef({ setState });
  
  useEffect(() => {
    settersRef.current.setState = setState;
  }, [setState]);
  ```

### Handling Collection Dependencies

- Never depend directly on `.size` or `.length` properties of Maps/Sets/Arrays - it causes unnecessary renders.
- For collections, either:
  1. Use refs to track collection state changes, or
  2. Memoize derived values from collections with useMemo

### Callback Stabilization Techniques

- Group related callbacks in a callbacksRef to maintain stable references:
  ```jsx
  const callbacksRef = useRef({
    fetchData: async () => { /* implementation */ },
    processData: (data) => { /* implementation */ },
    resetData: () => { /* implementation */ }
  });
  ```

- Only update callback refs when their dependencies actually change:
  ```jsx
  useEffect(() => {
    callbacksRef.current.fetchData = async () => {
      // Implementation that depends on userId
    };
  }, [userId]); // Only recreate when userId changes
  ```

### Derived State in Dependencies

- Always memoize derived state with `useMemo`.
- Validate effect dependency arrays carefully.
- Prefer stable identifiers over objects or arrays in dependencies.
- For array transformations (sort, filter, map), use a stable cached result instead of creating new arrays on each render.

### Specific Anti-Patterns to Avoid

- **Dual fetching**: Don't fetch the same data from both a component and its context.
- **Unstable identifiers in dependencies**: Avoid using functions that return new objects/arrays in dependency arrays.
- **Cross-context update cycles**: One context update should not trigger another context update in a cyclical manner.
- **Missed dependency warnings**: Always address React Hook dependency warnings rather than suppressing them.
- **Overcomplicated state management**: Break down complex state into smaller, more manageable pieces.
- **Late state access**: Don't try to access state immediately after updating it in the same function scope.

### Testing for Infinite Loop Prevention

- When implementing data fetching with React contexts:
  1. Monitor network traffic to check for repeated identical API calls.
  2. Add console.log statements in useEffect hooks to verify execution frequency.
  3. Use React DevTools profiler to identify components re-rendering excessively.
  4. Add debug counters for critical operations to detect excessive repetition.

### Debugging React Effect Loops

When debugging render loops, systematically:

1. Check your browser's network tab for repeated API calls
2. Add temporary logging for hook execution frequency: `useEffect(() => { console.count('Effect executed'); }, [dep1, dep2])`
3. Analyze dependency arrays for unstable references
4. Look for setState calls that might be triggering unnecessary renders
5. Inspect refs usage to ensure they're being used correctly
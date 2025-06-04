---
trigger: model_decision
description: Enforce safeguards against infinite loops in React effect hooks
---

## React useEffect Dependency Management

1. Functions that update state must be wrapped in `useCallback`.
2. Derived state must use `useMemo`.
3. Context interactions must have clear ownership.

### Context Interaction Guidelines

- One context should own data fetching; others should only consume.
- Avoid circular dependencies between contexts.
- When using multiple data contexts, clearly define which context is responsible for loading specific data.
- Never duplicate data fetching logic between a component and its context provider.

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

### Testing for Infinite Loop Prevention

- When implementing data fetching with React contexts:
  1. Monitor network traffic to check for repeated identical API calls.
  2. Add console.log statements in useEffect hooks to verify execution frequency.
  3. Use React DevTools profiler to identify components re-rendering excessively.
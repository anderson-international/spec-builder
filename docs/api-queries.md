# API Query Patterns for Spec-Builder

## Overview

This document outlines the correct patterns for querying data in the Spec-Builder API endpoints, particularly focusing on how to properly work with junction tables and related data.

## Specification API Queries

When querying specifications with related data, always follow these patterns:

### Base Fields

```typescript
// Direct fields
select: {
  id: true,
  shopify_handle: true,
  review: true,
  star_rating: true,
  created_at: true,
  updated_at: true,
  // ...other direct fields
}
```

### Simple Relations (One-to-Many)

For simple relations where Specification has a foreign key to another table:

```typescript
// Direct relation - use the relation name
product_type: {
  select: {
    id: true,
    name: true,
  },
},
product_brand: {
  select: {
    id: true,
    name: true,
  },
},
// ...other direct relations
```

### Junction Tables (Many-to-Many)

For junction tables (many-to-many relations), you must access the related data through the relationship:

```typescript
// Junction table relations - use the nested structure
tasting_notes: {
  select: {
    tasting_note: {  // Access via the relation name
      select: {
        id: true,
        name: true,
      },
    },
  },
},
tobacco_types: {
  select: {
    tobacco_type: {  // Access via the relation name
      select: {
        id: true,
        name: true,
      },
    },
  },
},
cures: {
  select: {
    cure: {  // Access via the relation name
      select: {
        id: true,
        name: true,
      },
    },
  },
},
```

## Component Interface Patterns

When defining interfaces for components that display specification data:

```typescript
// For junction table data, create wrapper interfaces
interface TastingNote {
  id: number;
  name: string;
}

interface TastingNoteWrapper {
  tasting_note: TastingNote;
}

interface Specification {
  // ...other fields
  tasting_notes: TastingNoteWrapper[];
}

// Access the data correctly in components
{spec.tasting_notes.map(note => (
  <span key={note.tasting_note.id}>{note.tasting_note.name}</span>
))}
```

By following these patterns consistently, you'll avoid errors related to accessing non-existent fields on junction tables and ensure the API endpoints work correctly with the database schema.

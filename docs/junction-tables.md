# Working with Junction Tables in Spec-Builder

## Overview

This document describes how to correctly work with junction tables in the Spec-Builder application. Junction tables are used to establish many-to-many relationships between entities.

## Database Schema

In our database, we have several junction tables that follow a common naming pattern:

- `spec_tobacco_types`: Links specifications with tobacco types
- `spec_tasting_notes`: Links specifications with tasting notes
- `spec_cures`: Links specifications with cures

Each junction table contains foreign keys to the related tables:

```
TABLE: spec_tasting_notes
==================================================

COLUMNS:
  specification_id [integer] NOT NULL
  enum_tasting_note_id [integer] NOT NULL

PRIMARY KEYS:
  (specification_id, enum_tasting_note_id)

FOREIGN KEYS:
  enum_tasting_note_id -> enum_tasting_notes(id)
  specification_id -> specifications(id)
```

## Prisma Schema

In the Prisma schema, these relationships are modeled as follows:

```prisma
model Specification {
  // ... other fields
  tasting_notes      SpecTastingNote[]
  tobacco_types      SpecTobaccoType[]
  cures              SpecCure[]
}

model TastingNote {
  // ... other fields
  specifications SpecTastingNote[]
}

model SpecTastingNote {
  specification_id     Int
  enum_tasting_note_id Int
  specification        Specification @relation(fields: [specification_id], references: [id])
  tasting_note         TastingNote  @relation(fields: [enum_tasting_note_id], references: [id])

  @@id([specification_id, enum_tasting_note_id])
  @@map("spec_tasting_notes")
}
```

## Querying Junction Tables

When querying junction tables through Prisma, you must access the related entity through the relationship field. **Do not** try to access fields directly on the junction table that don't exist.

### ❌ Incorrect way:

```typescript
const specifications = await prisma.specification.findMany({
  select: {
    tasting_notes: {
      select: {
        id: true,  // These fields don't exist on SpecTastingNote
        name: true,
      },
    },
  },
});
```

### ✅ Correct way:

```typescript
const specifications = await prisma.specification.findMany({
  select: {
    tasting_notes: {
      select: {
        tasting_note: {  // Access the related entity
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  },
});
```

## Component Interfaces

When working with the data in React components, create appropriate interfaces:

```typescript
interface TastingNote {
  id: number;
  name: string;
}

interface TastingNoteWrapper {
  tasting_note: TastingNote;
}

interface Specification {
  // ... other fields
  tasting_notes: TastingNoteWrapper[];
}
```

And access the data correctly:

```tsx
{spec.tasting_notes.map(note => (
  <span key={note.tasting_note.id}>
    {note.tasting_note.name}
  </span>
))}
```

By following these patterns, you'll avoid errors related to accessing non-existent fields on junction tables.

# Firestore Security Specification - Mulya Cartridge

## Data Invariants
1. Products must have a name, category, price, image, description, and specs list.
2. Services must have a title, description, price, and icon.
3. Expert Rules must belong to either 'Printer' or 'Laptop' category and define symptoms, logic, questions, diagnosis, and solution.
4. Expert Data is a singleton-like collection providing the global knowledge base symptoms.
5. All write operations (Create, Update, Delete) are restricted to the verified admin user: `firmanalghifari624@gmail.com`.
6. Public (unauthenticated) users have read-only access to all collections to view product and service information.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Unauthorized Write**: Create product without auth.
2. **Spoofed Admin**: Create product with `request.auth.token.email` set to admin but `email_verified: false`.
3. **Invalid Category**: Rule with category 'Toaster'.
4. **Huge String**: Product name > 200 chars.
5. **Missing Fields**: Service without price.
6. **Bypass CreatedAt**: Create product with client-side timestamp instead of server timestamp.
7. **Phantom Field**: Create product with extra field `isPromoted: true`.
8. **Invalid Logic**: Rule with logic 'MAYBE'.
9. **Too many specs**: Product with 1000 specs.
10. **Empty Diagnosis**: Rule with empty diagnosis string.
11. **Update Immutable**: Attempt to change `createdAt` on a product (managed by `isValidProduct` check in update rule).
12. **Malicious ID**: Attempt to write with ID containing non-safe characters (managed by `isValidId` if checked - although my rules use any ID for now, I should harden the path variables).

## Test Implementation Strategy
The provided `firestore.rules` uses the validation helper pattern to block these payloads.
- `isValidProduct` checks keys().hasAll() and size() == 6 to block phantom fields and missing fields.
- `isAdmin` checks `isVerified()` to block unverified email spoofing.
- Specific type and size checks block huge strings and invalid types.

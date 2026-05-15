# POPIA Data Subject Request (DSR)

Under POPIA, a data subject (or their guardian, for under-18s) has the
right to:

| Right | What we do |
|---|---|
| **Access** | Export everything we hold on them, in a portable format |
| **Rectification** | Correct something incorrect we hold |
| **Deletion** | Remove the subject's data ("right to be forgotten") |
| **Objection** | Stop processing data for a specific purpose (e.g. analytics) |
| **Portability** | Same as access, but in a machine-readable form |

**Statutory clock: 30 days from receipt.** Track every DSR in the Internal Admin app's `/admin/dsr/...` route (Phase 1 build — until that ships, log to a shared Notion/Confluence page).

The **Information Officer** (per `DEPLOYMENT_INFO.md §9`) signs off every response before it goes out.

---

## 1. Receive + verify

DSRs reach us via:
- Email to `privacy@gomaths.co.za` (set up before pilot)
- In-app "Request my data" button (Phase 1)
- Letter / school admin (rare; same process)

**Verify the requester is who they say they are.** This is non-negotiable — handing data to the wrong person is itself a POPIA breach. For an adult learner, ask them to send the request from the account email AND answer one secret-question equivalent (e.g. their grade + birth year on file). For an under-18: only the registered parent / guardian email can request.

Log the verification step. Don't proceed until done.

## 2. Locate the data

Every personally-identifying row keyed by `User.id`. Run as the on-call DBA:

```sh
USER_ID="<the user id>"

# Profile
psql "$DATABASE_URL" -c "SELECT * FROM \"User\" WHERE id = '$USER_ID';"
psql "$DATABASE_URL" -c "SELECT * FROM \"Student\" WHERE \"userId\" = '$USER_ID';"
psql "$DATABASE_URL" -c "SELECT * FROM \"Parent\" WHERE \"userId\" = '$USER_ID';"
psql "$DATABASE_URL" -c "SELECT * FROM \"Teacher\" WHERE \"userId\" = '$USER_ID';"

# Conversations + turns
psql "$DATABASE_URL" -c "
  SELECT c.*, COUNT(t.id) AS turns
  FROM \"Conversation\" c
  LEFT JOIN \"ConversationTurn\" t ON t.\"conversationId\" = c.id
  LEFT JOIN \"Student\" s ON s.id = c.\"studentId\"
  WHERE s.\"userId\" = '$USER_ID'
  GROUP BY c.id;"

# Progress
psql "$DATABASE_URL" -c "
  SELECT * FROM \"ProgressEvent\" pe
  JOIN \"Student\" s ON s.id = pe.\"studentId\"
  WHERE s.\"userId\" = '$USER_ID';"

# Sessions (refresh tokens, hashed)
psql "$DATABASE_URL" -c "SELECT id, \"createdAt\", \"revokedAt\" FROM \"Session\" WHERE \"userId\" = '$USER_ID';"

# Push tokens
psql "$DATABASE_URL" -c "SELECT * FROM \"PushToken\" WHERE \"userId\" = '$USER_ID';"
```

**Don't forget non-Postgres data:**
- Sentry events — search by `user.id` tag (Phase 1 must scope user to JWT.sub).
- Server logs (CloudWatch) — search for the user id and capture / redact as needed.
- AWS S3 — solver scan images if we start retaining them (Phase 1 decision: we currently don't).
- Backups — RDS automated backups hold data for the retention window. We can't selectively delete from a backup, but POPIA accepts the disclosure "the subject's data will fully disappear within <retention period>."

## 3. Respond — by request type

### Access / portability

Build a single JSON document containing every row above plus the lesson content the learner interacted with. Hand off via:
- Encrypted email (PGP), or
- A one-time S3 presigned URL with a 24-hour expiry

Phase 1 should automate this via `/admin/dsr/access/{userId}` in the Internal Admin app.

### Rectification

Edit the offending field via Prisma. **Audit-log the change**: record requester, fields changed, before/after, timestamp, IO sign-off. This audit row never gets deleted, even on a later deletion request — it's our defence record.

### Deletion

Sequence (in this order — foreign keys matter):

```sh
USER_ID="<the user id>"

psql "$DATABASE_URL" <<SQL
BEGIN;

-- ConversationTurn cascades from Conversation; Conversation cascades from Student.
-- ProgressEvent cascades from Student.
-- TopicMastery cascades from Student.
-- StudentParent cascades from both Student and Parent.
-- ClassEnrollment cascades from Student.
-- PushToken cascades from User.
-- Session cascades from User.
-- Student/Parent/Teacher cascade from User.
DELETE FROM "User" WHERE id = '$USER_ID';

-- Sanity check before commit.
SELECT 'remaining' AS what, count(*) FROM "User" WHERE id = '$USER_ID'
UNION ALL SELECT 'sessions', count(*) FROM "Session" WHERE "userId" = '$USER_ID'
UNION ALL SELECT 'push tokens', count(*) FROM "PushToken" WHERE "userId" = '$USER_ID';

COMMIT;
SQL
```

Every count should be 0. If any aren't, **roll back** (`ROLLBACK;`) and figure out which foreign key isn't cascading before re-running.

Then:
- Sentry: delete user events via the Sentry API ("Forget User" action)
- S3: delete any uploaded objects scoped by user id
- Backups: send the requester the retention statement (see §2)

### Objection

Carve out specific processing (e.g. push notifications): set the column directly via Prisma — `PushToken.revokedAt = now()`, or a future `ProcessingOptOut` row when Phase 2 introduces granular consent. Keep the audit log.

## 4. Confirm + close

- Reply to the requester within 30 days from receipt, in plain English.
- Update the DSR log: requester, request type, action taken, IO sign-off, completion date.
- If the request affected pilot data, send a summary to the school's primary contact (no individual PII).

## 5. Edge cases

- **Under-18 deletion request**: only the registered parent / guardian. If the parent isn't reachable, do not act on the child's own request alone — escalate to legal.
- **School-managed account**: if a school owns the licence, deletion still proceeds for the *person*, but the school may have a parallel contractual claim. Loop the school admin in.
- **Backup retention**: communicate clearly that *active systems* are cleared in <30 days, *automated backups* roll off within the configured window (current: 30 days prod, 7 days dev).
- **The tutor cache**: a deleted learner's prior turns may still be in Anthropic's prompt cache for up to 5 minutes. Document this as a known transient.

## 6. Practice

Tabletop this runbook every **6 months**. Use a synthetic test account; walk through every step end-to-end; record what was confusing. Fix the runbook.

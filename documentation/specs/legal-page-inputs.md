# `/legal` — inputs needed from Mark

The current `/legal` page is a placeholder list visible to visitors. To go live we need real content. French law (*mentions légales*) requires several specific items for any commercial site, and EU GDPR requires a clear data-processing notice.

Fill in the values below and ping Claude. The page will be built in EN/FR/DE — Mark only needs to supply the facts; Claude will draft the prose and translate.

---

## 1. Business identity (mentions légales — required by French law)

| Field | Mark's answer |
|---|---|
| **Legal form** (e.g. *micro-entreprise*, *auto-entrepreneur*, *SARL*, *SCI*, sole trader, none — purely private rental) | |
| **Registered business name** (the name on Mark's URSSAF / SIRET registration, if any) | |
| **SIRET number** (14 digits — only if registered as a business) | |
| **APE / NAF code** (e.g. *55.20Z* for furnished holiday rentals, only if SIRET applies) | |
| **VAT number** (TVA intracommunautaire — only if VAT-registered, often N/A under the *franchise en base*) | |
| **Registered address** (the address that appears on the SIRET filing — usually Mark's home or the cottage; can be either) | |
| **Publication director** (*directeur de publication* — usually Mark himself; required field but trivial) | |
| **Public contact email** (the address users can reach the business at — recommend `booking@mariannecottage.fr` since that's already public) | |
| **Public contact phone** (optional but recommended; can be omitted if Mark prefers email-only) | |

> If the cottage is rented purely as a private individual (no SIRET, no business registration), say so — there's a different *mentions légales* shape for non-professional rentals (still needs publication director + contact, but the SIRET / APE rows simply omit). Tell us which.

---

## 2. Hosting provider (required disclosure)

The site runs on Netlify. Standard disclosure text — Claude has the values, no input needed:

> Hébergeur : Netlify, Inc., 44 Montgomery Street, Suite 300, San Francisco, CA 94104, USA. Téléphone : +1 415 691 1573.

---

## 3. GDPR / data protection

| Field | Mark's answer |
|---|---|
| **Data controller** (the natural or legal person responsible for personal data — defaults to Mark personally if no business entity) | |
| **DPO contact** (Data Protection Officer — only required if processing is large-scale or sensitive; cottage scale = no DPO needed, contact is just the data controller) | |
| **Data-subject contact email** (where guests email to exercise their GDPR rights — access, deletion, rectification. Recommend `booking@mariannecottage.fr`) | |

Claude will write the standard processing notice covering: booking data (Supabase, EU region), payment data (Stripe — they're the controller for card details, we never store card numbers), email tracking (Brevo — open/click pixels with explicit consent), Google Maps tiles (with consent). All data inside the EU except the Netlify hosting (which is essentially log-only — no booking PII passes through US compute). Retention period default: bookings kept 10 years for accounting, deleted on request unless legally required to keep.

---

## 4. Cookies (already drafted by the cookie banner — just confirm)

The cookie banner currently lists:

- Essential — language preference, session
- With consent — Google Maps tiles, email tracking pixels (Brevo)

Confirm this is accurate, or tell me what else to mention.

| Field | Mark's answer |
|---|---|
| **Anything else collected?** (e.g. analytics, ad networks — currently nothing else is wired) | |

---

## 5. Terms of stay / cancellation (optional but recommended)

The cancellation policy is already snapshot per booking (see `cancellation_policies` table — currently the *Moderate* policy: ≥14d=100%, 7-13d=50%, <7d=0%). The /legal page should restate it in plain language so it's findable outside the booking flow.

| Field | Mark's answer |
|---|---|
| **Confirm cancellation policy summary** (default is the *Moderate* schedule above — say "yes, that's it" or specify a different summary) | |
| **House rules to mention?** (no smoking, pets, max guests, check-in/check-out times — covered already in `messages/*.json`, just confirm) | |
| **Damages / deposit?** (currently we don't take a deposit — confirm "no deposit") | |

---

## 6. ODR / online dispute resolution (EU requirement)

EU regulation requires a link to the ODR platform on commercial sites. Standard text Claude will add — no input needed:

> Conformément à la réglementation européenne, vous pouvez recourir à la plateforme de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr

Only relevant if Mark is operating as a registered business. If not (private rental), this row is dropped.

---

## How to return the answers

Just paste your answers under each row in this file (replace the empty cells), commit, and ping Claude. Don't worry about formatting — bullet points or one-liners are fine.

If Mark genuinely doesn't know something (e.g. whether he has a SIRET), say so — the answer changes the shape of the page. Better to ask the URSSAF or his accountant than to guess.

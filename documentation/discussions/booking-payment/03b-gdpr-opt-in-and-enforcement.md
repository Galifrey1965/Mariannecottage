# 03b — GDPR-Compliant Opt-In & Enforcement Reality

Rob asked: what does "GDPR-compliant opt-in" actually mean, and is GDPR actually enforced in France?

Both are good questions. Short answers: **specific things in the UI/data-handling**, and **yes, more than most EU countries**.

---

## What "GDPR-compliant opt-in" means in practice

GDPR (Article 4(11)) defines valid consent as: *freely given, specific, informed, and unambiguous indication, by a clear affirmative action.*

Translated into things we have to do in the UI:

| Requirement | What it means | What we'd build |
|---|---|---|
| **Affirmative action** | The user must actively tick a box. **Pre-ticked boxes are explicitly illegal** (GDPR Recital 32, confirmed by CJEU *Planet49* ruling 2019). | Checkbox unticked by default. No "by using this site you consent" blanket text. |
| **Specific** | Must say what they're consenting to in concrete terms. | "Send me occasional emails about availability and special offers" — not "we may contact you". |
| **Informed** | They must know who's processing their data, what for, retention period, their rights. | Link to privacy policy at point of consent; cottage's `/legal` page already has the structure for this. |
| **Granular** | Separate consents for separate purposes. | Booking confirmation emails are operational (different basis); marketing emails are a separate tickbox. |
| **Easy to withdraw** | Unsubscribing must be as easy as subscribing. | One-click unsubscribe link in every marketing email (Resend does this automatically). |
| **Documented** | Audit trail of when, how, what they consented to. | Stored in the `subscribers` table: `consent_at`, `consent_text`, `source`. |
| **Unbundled** | Can't make booking conditional on accepting marketing. | Booking form has its own required consent for transaction emails; marketing tickbox is separate and optional. |

In the UI, this looks like:

```
Booking form, end of page:
  [Submit booking →]

  ☐ Send me occasional emails about availability,
     seasonal offers and travel tips for Normandy.
     You can unsubscribe at any time. See our privacy policy.
```

That checkbox unticked. The user has to tick it. We store the exact wording shown, the timestamp, and the source ("booking-form-2026-05") so if challenged we can prove what they agreed to.

---

## What GDPR doesn't require (helpful exemption)

There's a useful exemption called **soft opt-in** for existing customers. Under French ePrivacy law (Article L.34-5 of the Code des postes et des communications électroniques), you can email past customers about similar products/services **without an explicit marketing tickbox** if all of these are true:

1. The contact details were obtained from them directly
2. In the context of a sale or service (i.e., they booked)
3. The marketing concerns similar products (cottage stays — yes)
4. They were informed at collection time of their right to opt out
5. Every email gives them an easy way to unsubscribe

**Practical implication for the cottage:**

| Audience | Basis for emailing them |
|---|---|
| **Past guests who booked direct** | Soft opt-in works — no separate marketing tickbox needed, just clear notice + unsubscribe |
| **Newsletter signups (no booking)** | **Explicit opt-in required** — they must tick a box |
| **Enquired but didn't book** | Grey area; safest is explicit opt-in |
| **Manual telephone bookings** | Mark must verbally inform them and record consent (we'd build a "consent recorded by phone" admin checkbox) |

This soft opt-in is genuinely useful — it means the post-stay email offering a direct-rebook discount is allowed without an explicit marketing tickbox at booking time, *provided* we tell guests at booking time they can opt out.

---

## Is GDPR actually enforced in France?

**Yes — France is one of the strictest enforcers in the EU.**

The French data protection authority is **CNIL** (*Commission nationale de l'informatique et des libertés*). It's been enforcing data protection law since 1978 — France had its *Loi Informatique et Libertés* decades before GDPR. CNIL is one of the most active regulators in Europe.

Recent enforcement examples:

| Year | Target | Fine | Reason |
|---|---|---|---|
| 2019 | Google | €50m | Inadequate consent for ad personalisation |
| 2020 | Amazon | €35m | Cookies without consent |
| 2022 | Google | €150m | Cookie banner design |
| 2022 | Facebook (Meta) | €60m | Cookie banner design |
| 2023 | Cdiscount | €1.5m | Marketing email without consent + retention violations |
| Ongoing | Smaller SMEs | €1k–€20k typical | Various — usually triggered by guest complaints |

**Realistic risk for a 2-bedroom cottage:**

The €50m fines aren't your problem. The realistic enforcement scenario for a small B&B is:

1. A guest receives a marketing email they don't recall opting in to.
2. They complain to CNIL via the online complaint form (10 minutes, in French).
3. CNIL writes to the cottage asking for explanations and proof of consent.
4. If consent can't be proven, **first action is usually a formal warning** with mandatory remediation. Fines come if non-compliance continues, typically **€500–€20,000** for SMEs in this space, though CNIL has the power to go higher.
5. Meanwhile Mark loses 5–20 hours dealing with the correspondence in French legal language.

**The fines are unlikely. The hassle is real.** CNIL is generally pragmatic with small businesses if there's a genuine attempt to comply — what gets people in trouble is sloppy consent records, no privacy policy, no unsubscribe links, or persistent ignoring of opt-out requests.

---

## What this means for our build

If we build the email list properly from day one — unticked boxes, clear consent text, documented audit trail, easy unsubscribe — we're in compliance and the risk is essentially zero. The work is:

- **One-time:** ~2–3 hours of getting the consent UI right and updating `/legal` with email-list specifics.
- **Per email:** zero. Resend handles unsubscribe links automatically.
- **Ongoing:** if a guest emails asking to be deleted, one click in admin → done. Probably 1–2 requests per year at cottage volume.

This is also why we'd never build email marketing ourselves with raw SMTP — using Resend (or MailerLite, SendGrid etc.) means the deliverability, unsubscribe links, bounce handling, and complaint handling are their problem, not ours.

---

## What we'd add to `/legal`

A small section in the privacy policy:

> **If you book or enquire with us, we may store your name, email address and the details of your booking or enquiry to communicate with you about your stay and, where you have opted in or where the law allows it, to send you occasional updates about availability and offers at the cottage. You can unsubscribe at any time using the link in any email we send, or by emailing us. We never sell your data.**

Add the standard legal-basis disclosure (Article 13 GDPR), retention period (we keep booking records for 5 years for accounting purposes; marketing list until unsubscribe), and the data subject rights (access, rectification, erasure, portability).

Already-translated content. AI can produce all three language versions.

---

## Verdict

GDPR-compliant opt-in is **a few specific UI behaviours plus an audit trail**, not a heavy compliance burden. Soft opt-in does most of the work for past-guest marketing, which is the main use case. CNIL enforcement is real and France is among the stricter EU jurisdictions, but the realistic cottage-scale risk is low *if we build it right from day one* — which costs us a few extra hours, not days.

This same compliance pattern applies to the booking system's existing data handling, the AI agent network in [`06-`](06-ai-augmented-admin-workflow.md), and any future Stripe integration. We'll do a fuller GDPR review for those later (it's still on the overview checklist).

// PR 5 (transactional email): per-locale string tables for email templates.
//
// Kept inside the email module rather than reaching into the site-wide
// messages/{en,fr,de}.json: those are bundled to the client and shouldn't
// carry server-only template strings. Server-side and small enough to hand-
// maintain alongside the templates.

import type { Locale } from './types';

export interface EmailStrings {
	common: {
		signature: string;       // closing line, e.g. "Mark & Kim"
		cottageName: string;
		viewInBrowser: string;
		footer: string;          // small print under the email
	};
	bookingConfirmation: {
		subject: string;         // params: {ref}
		heading: string;         // params: {name}
		intro: string;
		summaryHeading: string;
		labelReference: string;
		labelCheckIn: string;
		labelCheckOut: string;
		labelGuests: string;
		labelNights: string;
		labelTotal: string;
		nextSteps: string;
		cancelLinkPrompt: string;
		cancelLinkLabel: string;
		closing: string;
	};
	bookingCancelled: {
		subject: string;         // params: {ref}
		heading: string;         // params: {name}
		introWithRefund: string; // params: {amount}, {pct}, {policy}
		introWithoutRefund: string;
		summaryHeading: string;
		labelReference: string;
		labelCheckIn: string;
		labelCheckOut: string;
		closing: string;
	};
	bookingOverbooked: {
		subject: string;         // params: {ref}
		heading: string;         // params: {name}
		apology: string;
		refundLine: string;      // params: {amount}
		summaryHeading: string;
		labelReference: string;
		labelCheckIn: string;
		labelCheckOut: string;
		closing: string;
	};
	refundIssued: {
		subject: string;         // params: {ref}
		heading: string;         // params: {name}
		body: string;            // params: {amount}, {ref}
		timing: string;
		closing: string;
	};
	contactAcknowledgement: {
		subject: string;
		heading: string;         // params: {name}
		body: string;
		closing: string;
	};
}

const en: EmailStrings = {
	common: {
		signature: 'Mark & Kim',
		cottageName: 'Marianne Cottage',
		viewInBrowser: '',
		footer: 'Marianne Cottage · Normandy, France · mariannecottage.fr'
	},
	bookingConfirmation: {
		subject: 'Your booking is confirmed — {ref}',
		heading: 'Hello {name},',
		intro: 'Thank you for booking your stay with us. Your payment has cleared and your reservation is confirmed.',
		summaryHeading: 'Booking summary',
		labelReference: 'Reference',
		labelCheckIn: 'Check-in',
		labelCheckOut: 'Check-out',
		labelGuests: 'Guests',
		labelNights: 'Nights',
		labelTotal: 'Total paid',
		nextSteps: 'We will be in touch a few days before your arrival with directions and check-in details.',
		cancelLinkPrompt: 'If your plans change, you can cancel your booking using the link below. Refunds follow the cancellation policy you accepted at checkout.',
		cancelLinkLabel: 'Cancel my booking',
		closing: 'We look forward to welcoming you to Normandy.'
	},
	bookingCancelled: {
		subject: 'Your booking has been cancelled — {ref}',
		heading: 'Hello {name},',
		introWithRefund: 'Your booking has been cancelled. Per the {policy} cancellation policy ({pct}%), a refund of {amount} has been issued to the card you paid with. It typically clears within 5 to 10 business days.',
		introWithoutRefund: 'Your booking has been cancelled. No refund has been issued.',
		summaryHeading: 'Cancelled booking',
		labelReference: 'Reference',
		labelCheckIn: 'Check-in',
		labelCheckOut: 'Check-out',
		closing: 'If this was unexpected or you need anything else, just reply to this email.'
	},
	bookingOverbooked: {
		subject: 'We are unable to honour your booking — {ref}',
		heading: 'Hello {name},',
		apology: 'We are very sorry — due to a scheduling overlap we are unable to honour your booking for the dates below. This is entirely on our side and we apologise for the inconvenience.',
		refundLine: 'A full refund of {amount} has already been issued to the card you paid with. It typically clears within 5 to 10 business days.',
		summaryHeading: 'Affected booking',
		labelReference: 'Reference',
		labelCheckIn: 'Check-in',
		labelCheckOut: 'Check-out',
		closing: 'If you would like help finding alternative dates, just reply to this email and we will do everything we can.'
	},
	refundIssued: {
		subject: 'Refund issued — {ref}',
		heading: 'Hello {name},',
		body: 'A refund of {amount} for booking {ref} has now been processed by your bank.',
		timing: 'You should see it on your statement shortly. Card refunds in particular can take a few business days to appear depending on your bank.',
		closing: 'Thank you again for considering Marianne Cottage.'
	},
	contactAcknowledgement: {
		subject: 'We received your enquiry — Marianne Cottage',
		heading: 'Hello {name},',
		body: 'Thank you for getting in touch. We have received your enquiry and will reply as soon as we can — usually within a day or two.',
		closing: 'Best wishes,'
	}
};

const fr: EmailStrings = {
	common: {
		signature: 'Mark & Kim',
		cottageName: 'Marianne Cottage',
		viewInBrowser: '',
		footer: 'Marianne Cottage · Normandie, France · mariannecottage.fr'
	},
	bookingConfirmation: {
		subject: 'Votre réservation est confirmée — {ref}',
		heading: 'Bonjour {name},',
		intro: 'Merci d’avoir réservé votre séjour avec nous. Votre paiement a été accepté et votre réservation est confirmée.',
		summaryHeading: 'Récapitulatif de la réservation',
		labelReference: 'Référence',
		labelCheckIn: 'Arrivée',
		labelCheckOut: 'Départ',
		labelGuests: 'Voyageurs',
		labelNights: 'Nuits',
		labelTotal: 'Total payé',
		nextSteps: 'Nous reviendrons vers vous quelques jours avant votre arrivée avec les indications d’accès et les détails du check-in.',
		cancelLinkPrompt: 'En cas de changement, vous pouvez annuler votre réservation via le lien ci-dessous. Les remboursements suivent la politique d’annulation acceptée au moment du paiement.',
		cancelLinkLabel: 'Annuler ma réservation',
		closing: 'Nous avons hâte de vous accueillir en Normandie.'
	},
	bookingCancelled: {
		subject: 'Votre réservation a été annulée — {ref}',
		heading: 'Bonjour {name},',
		introWithRefund: 'Votre réservation a été annulée. Conformément à la politique d’annulation {policy} ({pct}%), un remboursement de {amount} a été émis sur la carte utilisée. Il apparaît généralement sous 5 à 10 jours ouvrés.',
		introWithoutRefund: 'Votre réservation a été annulée. Aucun remboursement n’a été émis.',
		summaryHeading: 'Réservation annulée',
		labelReference: 'Référence',
		labelCheckIn: 'Arrivée',
		labelCheckOut: 'Départ',
		closing: 'Si cela vous surprend ou que vous avez besoin de quoi que ce soit, répondez simplement à cet e-mail.'
	},
	bookingOverbooked: {
		subject: 'Nous ne pouvons honorer votre réservation — {ref}',
		heading: 'Bonjour {name},',
		apology: 'Nous sommes vraiment désolés — en raison d’un chevauchement de planning, nous ne pouvons pas honorer votre réservation pour les dates ci-dessous. La responsabilité nous incombe entièrement et nous vous prions de nous en excuser.',
		refundLine: 'Un remboursement intégral de {amount} a déjà été émis sur la carte utilisée. Il apparaît généralement sous 5 à 10 jours ouvrés.',
		summaryHeading: 'Réservation concernée',
		labelReference: 'Référence',
		labelCheckIn: 'Arrivée',
		labelCheckOut: 'Départ',
		closing: 'Si vous souhaitez de l’aide pour trouver d’autres dates, répondez simplement à cet e-mail et nous ferons tout notre possible.'
	},
	refundIssued: {
		subject: 'Remboursement émis — {ref}',
		heading: 'Bonjour {name},',
		body: 'Un remboursement de {amount} pour la réservation {ref} a maintenant été traité par votre banque.',
		timing: 'Vous devriez le voir sur votre relevé prochainement. Les remboursements par carte peuvent prendre quelques jours ouvrés selon votre banque.',
		closing: 'Merci encore d’avoir envisagé Marianne Cottage.'
	},
	contactAcknowledgement: {
		subject: 'Nous avons bien reçu votre message — Marianne Cottage',
		heading: 'Bonjour {name},',
		body: 'Merci de nous avoir écrit. Nous avons bien reçu votre message et reviendrons vers vous dès que possible — généralement sous un à deux jours.',
		closing: 'Bien cordialement,'
	}
};

const de: EmailStrings = {
	common: {
		signature: 'Mark & Kim',
		cottageName: 'Marianne Cottage',
		viewInBrowser: '',
		footer: 'Marianne Cottage · Normandie, Frankreich · mariannecottage.fr'
	},
	bookingConfirmation: {
		subject: 'Ihre Buchung ist bestätigt — {ref}',
		heading: 'Hallo {name},',
		intro: 'Vielen Dank für Ihre Buchung. Ihre Zahlung ist eingegangen und Ihre Reservierung ist bestätigt.',
		summaryHeading: 'Buchungsübersicht',
		labelReference: 'Referenz',
		labelCheckIn: 'Anreise',
		labelCheckOut: 'Abreise',
		labelGuests: 'Gäste',
		labelNights: 'Nächte',
		labelTotal: 'Gezahlter Gesamtbetrag',
		nextSteps: 'Wir melden uns einige Tage vor Ihrer Ankunft mit Anfahrt und Check-in-Informationen.',
		cancelLinkPrompt: 'Sollten sich Ihre Pläne ändern, können Sie Ihre Buchung über den untenstehenden Link stornieren. Erstattungen richten sich nach den beim Bezahlvorgang akzeptierten Stornierungsbedingungen.',
		cancelLinkLabel: 'Buchung stornieren',
		closing: 'Wir freuen uns darauf, Sie in der Normandie begrüßen zu dürfen.'
	},
	bookingCancelled: {
		subject: 'Ihre Buchung wurde storniert — {ref}',
		heading: 'Hallo {name},',
		introWithRefund: 'Ihre Buchung wurde storniert. Gemäß den Stornierungsbedingungen „{policy}“ ({pct}%) wurde eine Erstattung von {amount} auf die verwendete Karte veranlasst. Sie erscheint in der Regel innerhalb von 5 bis 10 Werktagen.',
		introWithoutRefund: 'Ihre Buchung wurde storniert. Eine Erstattung wurde nicht veranlasst.',
		summaryHeading: 'Stornierte Buchung',
		labelReference: 'Referenz',
		labelCheckIn: 'Anreise',
		labelCheckOut: 'Abreise',
		closing: 'Falls dies unerwartet kommt oder Sie noch etwas benötigen, antworten Sie einfach auf diese E-Mail.'
	},
	bookingOverbooked: {
		subject: 'Wir können Ihre Buchung nicht honorieren — {ref}',
		heading: 'Hallo {name},',
		apology: 'Es tut uns sehr leid — aufgrund einer Terminüberschneidung können wir Ihre Buchung für die unten genannten Daten nicht honorieren. Die Verantwortung liegt vollständig bei uns und wir bitten dafür um Entschuldigung.',
		refundLine: 'Eine vollständige Erstattung in Höhe von {amount} wurde bereits auf die verwendete Karte veranlasst. Sie erscheint in der Regel innerhalb von 5 bis 10 Werktagen.',
		summaryHeading: 'Betroffene Buchung',
		labelReference: 'Referenz',
		labelCheckIn: 'Anreise',
		labelCheckOut: 'Abreise',
		closing: 'Wenn Sie Hilfe bei der Suche nach Alternativterminen möchten, antworten Sie einfach auf diese E-Mail — wir tun, was wir können.'
	},
	refundIssued: {
		subject: 'Erstattung veranlasst — {ref}',
		heading: 'Hallo {name},',
		body: 'Eine Erstattung von {amount} für die Buchung {ref} wurde nun von Ihrer Bank verarbeitet.',
		timing: 'Sie sollte in Kürze auf Ihrem Auszug erscheinen. Karten-Erstattungen können je nach Bank einige Werktage dauern.',
		closing: 'Nochmals vielen Dank, dass Sie Marianne Cottage in Betracht gezogen haben.'
	},
	contactAcknowledgement: {
		subject: 'Wir haben Ihre Anfrage erhalten — Marianne Cottage',
		heading: 'Hallo {name},',
		body: 'Vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und melden uns so bald wie möglich — meist innerhalb von ein bis zwei Tagen.',
		closing: 'Mit besten Grüßen,'
	}
};

const TABLES: Record<Locale, EmailStrings> = { en, fr, de };

export function strings(lang: Locale): EmailStrings {
	return TABLES[lang] ?? TABLES.en;
}

export function interpolate(template: string, params: Record<string, string | number>): string {
	let out = template;
	for (const [key, val] of Object.entries(params)) {
		out = out.replaceAll(`{${key}}`, String(val));
	}
	return out;
}

const LOCALE_TO_BCP47: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };

export function formatDateForLocale(iso: string, lang: Locale): string {
	const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
	return new Intl.DateTimeFormat(LOCALE_TO_BCP47[lang], {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(d);
}

export function formatCurrencyForLocale(amount: number, currency: string, lang: Locale): string {
	return new Intl.NumberFormat(LOCALE_TO_BCP47[lang], {
		style: 'currency',
		currency
	}).format(amount);
}

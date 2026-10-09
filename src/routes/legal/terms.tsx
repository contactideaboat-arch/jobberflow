import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSections } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service. JobberFlow." },
      {
        name: "description",
        content: "The terms that govern use of the JobberFlow job work ERP service.",
      },
    ],
  }),
  component: TermsPage,
});

const SECTIONS = [
  {
    h: "1. Agreement",
    p: [
      "These terms govern your use of JobberFlow, a hosted job work inventory, production and reconciliation system. By creating a workspace or signing in you accept them. If you are accepting on behalf of a company, you confirm you have authority to bind that company.",
      "We may update these terms. Material changes will be announced in the product at least 14 days before they take effect, and the effective date at the top of this page will change.",
    ],
  },
  {
    h: "2. The service",
    p: [
      "JobberFlow provides tools to record raw material receipt, issue to jobbers, production output against a bill of materials, wastage, finished goods and reconciliation. We host the application and its database and provide it on a subscription basis.",
      "We may add, change or remove features. We will not materially degrade a feature you are paying for without giving you notice and a reasonable migration path.",
    ],
  },
  {
    h: "3. Accounts and access",
    p: [
      "You are responsible for activity under your accounts and for keeping credentials confidential. The first account created on a workspace becomes its administrator and can assign roles. Roles are enforced on write: a viewer or management account cannot post a voucher.",
      "Tell us promptly if you suspect unauthorised access. You are responsible for activity that occurs through your credentials before we are notified.",
    ],
  },
  {
    h: "4. Your data",
    p: [
      "You retain all rights to the data you enter, including masters, vouchers, stock balances and reconciliation records. You grant us only the licence needed to operate the service for you: to store, process, transmit and display your data as you direct.",
      "You are responsible for the accuracy of what you enter and for keeping your own statutory and accounting records. We provide export to CSV and Excel so you are never locked in.",
    ],
  },
  {
    h: "5. Acceptable use",
    p: [
      "Do not use the service to store or distribute unlawful material, to infringe intellectual property, to attempt to gain unauthorised access to any system, or to interfere with the service's operation for other customers.",
      "Automated access must stay within agreed rate limits. Bulk export of another customer's data is prohibited.",
    ],
  },
  {
    h: "6. Availability",
    p: [
      "We target 99.5% monthly availability excluding scheduled maintenance announced in advance. We do not guarantee uninterrupted service and we are not liable for losses caused by downtime.",
    ],
  },
  {
    h: "7. Suspension and termination",
    p: [
      "You may stop using the service and delete your workspace at any time. We may suspend access immediately where necessary to protect the service, other customers, or to comply with law, and will tell you why.",
      "On termination we will make your data exportable for 30 days, after which we may delete it. We will confirm before deleting anything.",
    ],
  },
  {
    h: "8. Disclaimers",
    p: [
      "The service is provided as is. It is a record-keeping tool, not a source of accounting or legal advice. You remain responsible for the judgements your business makes on the basis of the data.",
    ],
  },
  {
    h: "9. Liability",
    p: [
      "To the extent permitted by law, our aggregate liability arising out of the service is limited to the amount you paid us in the 12 months before the event giving rise to the claim. We are not liable for indirect or consequential loss, including lost profit or lost business.",
      "Nothing here limits liability that cannot lawfully be limited, including for death or personal injury caused by negligence, or for fraud.",
    ],
  },
  {
    h: "10. Governing law",
    p: [
      "These terms are governed by the laws of the jurisdiction in which our contracting entity is registered, without affecting any mandatory consumer protections available to you where you live.",
    ],
  },
  {
    h: "11. Contact",
    p: [
      "Questions about these terms can be sent to legal@jobberflow.app. We will respond within a reasonable time.",
    ],
  },
];

function TermsPage() {
  return (
    <LegalLayout
      title="Terms of service"
      updated="12 February 2026"
      intro="These terms set out the agreement between you and JobberFlow when you use our job work inventory, production and reconciliation software."
    >
      <LegalSections sections={SECTIONS} />
    </LegalLayout>
  );
}

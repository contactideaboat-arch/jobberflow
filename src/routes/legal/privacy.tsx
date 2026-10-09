import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSections } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy. JobberFlow." },
      {
        name: "description",
        content:
          "What data JobberFlow collects, why we hold it, and the controls you have over it.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    h: "1. Who this applies to",
    p: [
      "This policy covers the JobberFlow application and the workspaces hosted on it. It does not cover a third-party site you link to from within JobberFlow.",
    ],
  },
  {
    h: "2. Data we collect",
    p: [
      "Account data: the email address you sign in with, your display name, and the role assigned to your account.",
      "Workspace data: everything your team enters, including raw material and finished product masters, jobber records, bills of materials, vouchers, stock balances, wastage and reconciliation results. This is your business data and you control it.",
      "Technical data: session tokens, the IP address and user agent of each request, and records of sign-in and audit events including which user created, changed or cancelled a voucher.",
      "Support correspondence: messages you send us and the diagnostics you choose to include.",
    ],
  },
  {
    h: "3. Why we hold it",
    p: [
      "To operate the service: authenticating you, rendering your workspace, enforcing role permissions and persisting your records.",
      "To keep the service secure: detecting unauthorised access, investigating audit events and preventing abuse.",
      "To meet legal obligations: tax, accounting and statutory record-keeping requirements that apply to your business.",
      "To support you: answering your questions and diagnosing faults you report.",
      "We do not sell your data and we do not use your workspace contents to train models.",
    ],
  },
  {
    h: "4. Sharing",
    p: [
      "We share data with infrastructure providers that host the application and database, and with a payment processor if you subscribe to a paid plan. Each is bound by contract to process data only on our instructions.",
      "We disclose data where required by law or valid legal process, and will tell you unless prohibited from doing so.",
      "In a merger or sale of the business, your data transfers to the successor entity under the same terms.",
    ],
  },
  {
    h: "5. International transfers",
    p: [
      "Our providers process data in countries other than your own. Where data leaves your jurisdiction we rely on standard contractual clauses or an adequacy decision.",
    ],
  },
  {
    h: "6. Retention",
    p: [
      "Workspace data is retained for as long as your workspace is active. On deletion we hold it for 30 days to allow export, then remove it from primary storage and backups on the following backup cycle.",
      "Audit and security logs are retained for 12 months. Support correspondence is retained for 24 months.",
    ],
  },
  {
    h: "7. Your rights",
    p: [
      "You can access and export your workspace data at any time using the built-in CSV and Excel export, without asking us.",
      "You can correct or update records in the application. Vouchers are not silently edited; corrections are made by dated, attributed entries so the history stays intact.",
      "You can request access, correction, deletion or export of your personal data, object to processing, and withdraw consent where consent is our basis. Write to privacy@jobberflow.app and we will respond within 30 days.",
    ],
  },
  {
    h: "8. Cookies",
    p: [
      "We use a session cookie to keep you signed in and to protect against cross-site request forgery. These are strictly necessary and cannot be disabled without breaking the application. We do not use advertising or cross-site tracking cookies.",
    ],
  },
  {
    h: "9. Security",
    p: [
      "Data is encrypted in transit with TLS and at rest. Access to production systems is limited to staff who need it and is logged. Row-level permissions are enforced in the database so a role restriction holds even if the interface is bypassed.",
      "No system is perfectly secure. If we discover a breach affecting your data we will notify you and the relevant authority within the statutory timeframe.",
    ],
  },
  {
    h: "10. Children",
    p: [
      "JobberFlow is a business tool and is not intended for anyone under 16. We do not knowingly collect data from children.",
    ],
  },
  {
    h: "11. Changes and contact",
    p: [
      "We will post any change to this policy on this page and update the date above. Material changes affecting how we use your data will be announced in the product in advance.",
      "Questions about privacy can be sent to privacy@jobberflow.app.",
    ],
  },
];

function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy policy"
      updated="12 February 2026"
      intro="What data JobberFlow collects, why we hold it, who we share it with, and the controls you have over it."
    >
      <LegalSections sections={SECTIONS} />
    </LegalLayout>
  );
}

import { parseWorkbookFromFile } from "../src/lib/import/excel";

async function main() {
  const b = await parseWorkbookFromFile("./data/planilha-modelo.xlsx");
  console.log(
    JSON.stringify(
      {
        settings: b.settings,
        agenda: b.agenda.length,
        billMatrix: b.billMatrix.length,
        fixed: b.fixedExpenses.length,
        loans: b.installmentLoans.length,
        open: b.openDebts.length,
        parcels: b.loanParcels.length,
        cards: b.cards.length,
        cashDays: b.cashflow?.days.length,
        pri: b.priorities.length,
        assets: b.assets.length,
        liab: b.liabilities.length,
        proj: b.projections.length,
        alerts: b.alerts.length,
        candidates: b.debtCandidates.map((c) => c.name),
        scenario: b.scenario,
        sampleCard: b.cards[0],
        sampleAgenda: b.agenda.slice(0, 2),
        sampleLoan: b.installmentLoans[0],
        sampleOpen: b.openDebts[0],
        sampleFix: b.fixedExpenses[0],
        samplePri: b.priorities.slice(0, 3),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

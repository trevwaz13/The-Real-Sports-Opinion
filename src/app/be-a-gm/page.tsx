import type { Metadata } from "next";
import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import RosterBuilder from "@/components/gm/RosterBuilder";
import { SALARY_CAP } from "@/components/gm/roster";

export const metadata: Metadata = {
  title: "Be a GM | RSO",
  description:
    "Build a starting lineup from real NFL players under a real salary cap, scored by the RSO engine.",
};

export default function BeAGmPage() {
  return (
    <PageContainer>
      <PageHeading title="Be a GM" badge>
        Nineteen starters, ${SALARY_CAP}M to spend. Contract values are real
        average-annual-value figures from OverTheCap, and every lineup is graded
        by the same RSO engine that drives the official rankings.
      </PageHeading>
      <RosterBuilder />
    </PageContainer>
  );
}

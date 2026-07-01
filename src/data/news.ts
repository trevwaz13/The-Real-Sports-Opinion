// Mock league news — headlines, injury notes, and free-agency buzz for the
// home page. Real implementations would swap this for a news API; the
// getNews() accessor in api.ts is the only thing pages call.

export type NewsCategory = "news" | "injury" | "free-agency";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  timeAgo: string;
}

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    category: "news",
    headline: "Chiefs, Bills headline Week 1 marquee matchups",
    summary:
      "A loaded opening slate features three rematches of last season's playoff games.",
    timeAgo: "2h ago",
  },
  {
    id: "n2",
    category: "injury",
    headline: "Star pass rusher limited in practice, questionable for opener",
    summary:
      "Coaches are optimistic but calling it a game-time decision after a tweaked hamstring.",
    timeAgo: "4h ago",
  },
  {
    id: "n3",
    category: "free-agency",
    headline: "Veteran safety still on the market as camps open",
    summary:
      "Multiple contenders have shown interest in the two-time Pro Bowler.",
    timeAgo: "6h ago",
  },
  {
    id: "n4",
    category: "news",
    headline: "Rookie QB named Week 1 starter after strong preseason",
    summary:
      "The first-round pick beat out the incumbent with a clean three-game slate.",
    timeAgo: "9h ago",
  },
  {
    id: "n5",
    category: "injury",
    headline: "Pro Bowl running back activated off PUP list",
    summary: "He's expected to be on a snap count for the first few weeks.",
    timeAgo: "12h ago",
  },
  {
    id: "n6",
    category: "free-agency",
    headline: "Contender signs veteran slot receiver to one-year deal",
    summary: "The move adds proven depth to a young receiving corps.",
    timeAgo: "1d ago",
  },
];

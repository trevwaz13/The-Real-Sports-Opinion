import newsData from "./real/news.json";

// The league feed, derived from the live data by scripts/fetch_nfl_data.py:
// standout performances from the last completed week, this week's injury
// designations, and the marquee upcoming matchup. Nothing here is editorial —
// every line is generated from the same nflverse data the rest of the site uses.

export type NewsCategory = "news" | "injury" | "free-agency";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  timeAgo: string;
}

export const NEWS: NewsItem[] = newsData as NewsItem[];

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const START = "<!-- profile-now:start -->";
const END = "<!-- profile-now:end -->";

export const projects = [
  { repo: "Backslash", label: "Backslash" },
  { repo: "Binderly", label: "Binderly" },
  { repo: "firecrawl", label: "Firecrawl Community" },
  { repo: "github-orbit", label: "GitHub Orbit" },
  { repo: "browserpilot", label: "browserpilot" },
  { repo: "Feather", label: "Feather" },
];

export function replaceNowSection(readme, rendered) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);

  if (start === -1 || end === -1 || end < start) {
    throw new Error("README is missing a valid profile-now marker pair");
  }

  return `${readme.slice(0, start + START.length)}\n${rendered}\n${readme.slice(end)}`;
}

export function renderNowSection(items) {
  return items
    .slice()
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt))
    .slice(0, 3)
    .map((item) => {
      const signal = item.release
        ? item.release
        : `updated ${new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }).format(new Date(item.pushedAt))}`;

      return `[**${item.label}**](${item.url}) \`${signal}\``;
    })
    .join(" · ");
}

async function github(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "manan-santoki-profile-refresh",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }

  return response.json();
}

async function latestRelease(owner, repo, token) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "manan-santoki-profile-refresh",
      },
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} while reading ${repo} releases`);
  }

  return (await response.json()).tag_name;
}

export async function updateProfile({ owner, readmePath, token }) {
  if (!token) throw new Error("GH_TOKEN is required");

  const items = await Promise.all(
    projects.map(async ({ repo, label }) => {
      const [metadata, release] = await Promise.all([
        github(`/repos/${owner}/${repo}`, token),
        latestRelease(owner, repo, token),
      ]);

      return {
        label,
        pushedAt: metadata.pushed_at,
        release,
        url: metadata.html_url,
      };
    }),
  );

  const readme = await readFile(readmePath, "utf8");
  const next = replaceNowSection(readme, renderNowSection(items));
  if (next !== readme) await writeFile(readmePath, next, "utf8");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await updateProfile({
    owner: process.env.PROFILE_OWNER ?? "Manan-Santoki",
    readmePath: process.env.PROFILE_README ?? "ReadMe.md",
    token: process.env.GH_TOKEN,
  });
}

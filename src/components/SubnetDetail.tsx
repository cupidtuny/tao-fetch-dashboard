import type { SubnetIdentity, SubnetPool } from "@/lib/taostats";
import {
  discordUrl,
  githubUrl,
  mailto,
  twitterUrl,
  websiteUrl,
} from "@/lib/links";
import { Sparkline } from "./Sparkline";

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
    >
      {label}
    </a>
  );
}

/** Inline detail shown when a subnet row is expanded. */
export function SubnetDetail({
  identity,
  pool,
  hidden,
  onToggleHide,
}: {
  identity: SubnetIdentity | null;
  pool: SubnetPool;
  hidden: boolean;
  onToggleHide: () => void;
}) {
  const name = identity?.subnet_name ?? pool.name ?? `Subnet ${pool.netuid}`;

  const links: { href: string; label: string }[] = [];
  const website = websiteUrl(identity?.subnet_url);
  const github = githubUrl(identity?.github_repo);
  const discord = discordUrl(identity?.discord);
  const twitter = twitterUrl(identity?.twitter);
  const email = mailto(identity?.subnet_contact);
  if (website) links.push({ href: website, label: "Website" });
  if (github) links.push({ href: github, label: "GitHub" });
  if (discord) links.push({ href: discord, label: "Discord" });
  if (twitter) links.push({ href: twitter, label: "Twitter / X" });
  if (email) links.push({ href: email, label: "Contact" });

  const description = identity?.description;
  const summary = identity?.summary;
  const tags = identity?.tags ?? [];
  const nothing = !description && !summary && links.length === 0 && tags.length === 0;

  return (
    <div className="flex flex-col gap-5 px-4 py-5 sm:flex-row">
      {identity?.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={identity.logo_url}
          alt={`${name} logo`}
          className="h-12 w-12 shrink-0 rounded-lg border border-neutral-700 bg-neutral-900 object-contain p-1"
        />
      )}

      <div className="min-w-0 flex-1 space-y-3">
        {description && (
          <p className="break-words text-neutral-300">{description}</p>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <LinkPill key={l.label} href={l.href} label={l.label} />
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-xs text-neutral-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {summary && (
          <p className="break-words text-sm leading-relaxed text-neutral-400">
            {summary}
          </p>
        )}

        {nothing && (
          <p className="text-sm text-neutral-500">
            No identity details published for this subnet.
          </p>
        )}
      </div>

      <div className="shrink-0 space-y-4 sm:w-40">
        <a
          href={`https://taostats.io/subnets/${pool.netuid}/metagraph?order=incentive%3Adesc`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block rounded-lg bg-neutral-100 px-3 py-2 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
        >
          Subnet view ↗
        </a>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleHide();
          }}
          className="block w-full rounded-lg border border-neutral-700 px-3 py-2 text-center text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
        >
          {hidden ? "Unhide subnet" : "Hide subnet"}
        </button>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            7-Day Price
          </div>
          <div className="mt-2">
            <Sparkline points={pool.seven_day_prices} />
          </div>
        </div>
      </div>
    </div>
  );
}

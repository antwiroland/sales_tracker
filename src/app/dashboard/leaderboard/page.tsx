import { Trophy, Medal, Award } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getLeaderboard } from "@/lib/kpi-engine";
import { currentMonthYear, formatCurrency, formatPercent, MONTH_NAMES } from "@/lib/utils";
import { PageHeader, Card, ProgressBar, Avatar } from "@/components/ui";
import { HealthBadge } from "@/components/HealthBadge";
import { cn } from "@/lib/utils";

const medalColor = ["text-amber-400", "text-slate-400", "text-amber-700"];

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const { month, year } = currentMonthYear();
  const board = await getLeaderboard(month, year);

  const myRank = board.findIndex((e) => e.employeeId === user.id) + 1;
  const podium = board.slice(0, 3);

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle={`${MONTH_NAMES[month - 1]} ${year} · ranked by approved sales`}
      />

      {myRank > 0 && (
        <Card className="mb-6 border-brand-200 bg-brand-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-700">Your current position</p>
              <p className="text-3xl font-bold text-brand-700">#{myRank}</p>
            </div>
            {myRank > 1 && (
              <p className="text-right text-sm text-slate-600">
                Need{" "}
                <span className="font-semibold text-brand-700">
                  {formatCurrency(
                    Math.max(board[myRank - 2].approved - board[myRank - 1].approved, 0) + 1,
                  )}
                </span>
                <br />
                to reach #{myRank - 1}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Podium */}
      {podium.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {podium.map((e, i) => (
            <Card
              key={e.employeeId}
              className={cn(
                "flex flex-col items-center text-center",
                i === 0 && "ring-2 ring-amber-300",
              )}
            >
              <div className="relative">
                <Avatar name={e.name} src={e.photoUrl} size={64} />
                <Trophy
                  size={20}
                  className={cn("absolute -right-1 -top-1", medalColor[i])}
                  fill="currentColor"
                />
              </div>
              <p className="mt-2 font-semibold text-slate-800">{e.name}</p>
              <p className="text-xs text-slate-400">{e.branchName}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrency(e.approved)}
              </p>
              <p className="text-xs text-slate-500">{formatPercent(e.achievementPercent)}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-0">
        <ul>
          {board.map((e, i) => {
            const isMe = e.employeeId === user.id;
            return (
              <li
                key={e.employeeId}
                className={cn(
                  "flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0",
                  isMe && "bg-brand-50/50",
                )}
              >
                <span className="w-8 flex-shrink-0 text-center font-bold text-slate-400">
                  {i < 3 ? (
                    <Medal size={18} className={cn("mx-auto", medalColor[i])} />
                  ) : (
                    i + 1
                  )}
                </span>
                <Avatar name={e.name} src={e.photoUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">
                    {e.name} {isMe && <span className="text-xs text-brand-600">(You)</span>}
                  </p>
                  <p className="text-xs text-slate-400">{e.branchName}</p>
                </div>
                <div className="hidden w-40 sm:block">
                  <ProgressBar percent={e.achievementPercent} />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {formatPercent(e.achievementPercent)}
                  </p>
                </div>
                <div className="w-28 text-right">
                  <p className="font-semibold text-slate-800">{formatCurrency(e.approved)}</p>
                  <p className="text-xs text-slate-400">{e.approvedCount} invoices</p>
                </div>
                <div className="hidden md:block">
                  <HealthBadge health={e.forecast.health} />
                </div>
              </li>
            );
          })}
          {board.length === 0 && (
            <li className="px-4 py-12 text-center text-sm text-slate-400">
              No sales personnel data yet.
            </li>
          )}
        </ul>
      </Card>
    </>
  );
}


import type { ElectionRoom, Candidate } from "@/lib/types";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ResultsPdfLayoutProps {
    room: ElectionRoom | null;
}

interface LeaderboardCandidate extends Candidate {
  positionTitle: string;
  totalVotesInPosition: number;
}

export default function ResultsPdfLayout({ room }: ResultsPdfLayoutProps) {
    const leaderboardData = useMemo(() => {
        if (!room || !room.positions) return [];
        const positionTotals = new Map<string, number>();

        room.positions.forEach(position => {
            const totalVotes = position.candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
            positionTotals.set(position.id, totalVotes);
        });

        const allCandidates: LeaderboardCandidate[] = [];
        room.positions.forEach(position => {
            position.candidates.forEach(candidate => {
                allCandidates.push({ 
                  ...candidate, 
                  positionTitle: position.title,
                  totalVotesInPosition: positionTotals.get(position.id) || 0,
                });
            });
        });
        return allCandidates.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    }, [room]);
    
    if (!room) {
        return null;
    }

    return (
        <div id="pdf-content">
            {/* This table contains the detailed breakdown per position */}
            <table id="pdf-results-table">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Rank</th>
                        <th>Candidate</th>
                        <th>Votes</th>
                    </tr>
                </thead>
                <tbody>
                    {room.positions.map((position) => {
                        const totalVotesInPosition = position.candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
                        const sortedCandidates = [...position.candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
                        const maxVotes = sortedCandidates.length > 0 ? (sortedCandidates[0].voteCount || 0) : 0;
                        
                        return sortedCandidates.map((candidate, index) => {
                             const isWinner = (candidate.voteCount || 0) === maxVotes && maxVotes > 0;
                             
                             return (
                                <tr key={candidate.id} className={cn(isWinner && 'winner-row')}>
                                    {index === 0 && (
                                        <td rowSpan={sortedCandidates.length}>
                                            {position.title}
                                        </td>
                                    )}
                                    <td>{index + 1}{isWinner ? ' (Winner)' : ''}</td>
                                    <td>{candidate.name}</td>
                                    <td>{`${candidate.voteCount || 0} / ${totalVotesInPosition}`}</td>
                                </tr>
                             )
                        });
                    })}
                </tbody>
            </table>

            {/* This table is for the overall leaderboard */}
            <table id="pdf-leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Candidate</th>
                        <th>Position</th>
                        <th>Total Votes</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.map((candidate, index) => (
                        <tr key={candidate.id}>
                            <td>{index + 1}</td>
                            <td>{candidate.name}</td>
                            <td>{candidate.positionTitle}</td>
                            <td>{`${candidate.voteCount || 0} / ${candidate.totalVotesInPosition}`}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

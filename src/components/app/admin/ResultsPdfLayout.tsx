
import type { ElectionRoom, Candidate } from "@/lib/types";
import { useMemo } from "react";

interface ResultsPdfLayoutProps {
    room: ElectionRoom | null;
}

interface LeaderboardCandidate extends Candidate {
  positionTitle: string;
}

export default function ResultsPdfLayout({ room }: ResultsPdfLayoutProps) {
    const leaderboardData = useMemo(() => {
        if (!room || !room.positions) return [];
        const allCandidates: LeaderboardCandidate[] = [];
        room.positions.forEach(position => {
            position.candidates.forEach(candidate => {
                allCandidates.push({ ...candidate, positionTitle: position.title });
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
                        const sortedCandidates = [...position.candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
                        const maxVotes = sortedCandidates.length > 0 ? (sortedCandidates[0].voteCount || 0) : 0;
                        
                        return sortedCandidates.map((candidate, index) => {
                             const isWinner = (candidate.voteCount || 0) === maxVotes && maxVotes > 0;
                             
                             return (
                                <tr key={candidate.id}>
                                    {index === 0 && (
                                        <td rowSpan={sortedCandidates.length}>
                                            {position.title}
                                        </td>
                                    )}
                                    <td>{index + 1}{isWinner ? ' (Winner)' : ''}</td>
                                    <td>{candidate.name}</td>
                                    <td>{candidate.voteCount || 0}</td>
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
                        <th colSpan={4}>Overall Leaderboard</th>
                    </tr>
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
                            <td>{candidate.voteCount || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

import { forwardRef } from "react";
import type { VoterCardData } from "@shared/schema";
import {
  templatesCSS,
  getElectionTitle,
  getElectionLevel,
  getElectionTypeBadge,
  getDisplayValues,
  getValueColorCSS,
  getDisplayShareUrl,
  MAX_DECISIONS,
  DOWNLOAD_DIMENSIONS,
} from "@/lib/card-styles";

export type AspectRatio = "9:16" | "1:1";

interface DownloadableVoterCardProps {
  data: VoterCardData;
  aspectRatio?: AspectRatio;
  shareUrl?: string;
  username?: string | null;
}

export const DownloadableVoterCard = forwardRef<HTMLDivElement, DownloadableVoterCardProps>(
  ({ data, aspectRatio = "9:16", shareUrl, username }, ref) => {
    const style = templatesCSS[data.template];
    const isSquare = aspectRatio === "1:1";
    
    const width = DOWNLOAD_DIMENSIONS.width;
    const height = isSquare ? DOWNLOAD_DIMENSIONS.squareHeight : DOWNLOAD_DIMENSIONS.storyHeight;
    
    const visibleDecisions = data.decisions.filter(d => !d.hidden);
    const maxDecisions = isSquare ? MAX_DECISIONS.downloadSquare : MAX_DECISIONS.downloadStory;
    const displayDecisions = visibleDecisions.slice(0, maxDecisions);

    const electionTitle = getElectionTitle(data.electionDate, data.electionType, data.state);
    const electionLevel = getElectionLevel(data.electionType);
    const electionTypeBadge = getElectionTypeBadge(data.electionType);

    const getValueColor = (decision: string) => getValueColorCSS(decision, style.text);

    const displayUrl = getDisplayShareUrl(data.id || 'preview', username, shareUrl);

    const containerStyle: React.CSSProperties = {
      width: `${width}px`,
      height: `${height}px`,
      background: style.background,
      backgroundColor: style.backgroundColor,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      letterSpacing: "0.5px",
    };

    const contentStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: isSquare ? "80px" : "120px 80px",
      position: "relative",
      zIndex: 10,
    };

    const headerStyle: React.CSSProperties = {
      textAlign: "center",
      marginBottom: isSquare ? "60px" : "80px",
    };

    const iconContainerStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "24px",
    };

    const titleStyle: React.CSSProperties = {
      fontSize: isSquare ? "64px" : "72px",
      fontWeight: 700,
      color: style.text,
      margin: "0 0 32px 0",
      lineHeight: 1.2,
      letterSpacing: "1px",
    };

    const badgeContainerStyle: React.CSSProperties = {
      display: "flex",
      justifyContent: "center",
      gap: "16px",
      marginBottom: "28px",
    };

    const badgeStyle: React.CSSProperties = {
      background: style.badgeBg,
      color: style.badgeText,
      padding: "14px 32px",
      borderRadius: "9999px",
      fontSize: "28px",
      fontWeight: 500,
      letterSpacing: "0.5px",
    };

    const subtitleStyle: React.CSSProperties = {
      fontSize: "32px",
      color: style.accent,
      fontWeight: 500,
      letterSpacing: "1px",
    };

    const decisionsContainerStyle: React.CSSProperties = {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    };

    const decisionRowStyle: React.CSSProperties = {
      padding: isSquare ? "28px 0" : "32px 0",
      borderBottom: `2px solid ${style.divider}`,
    };

    const decisionRowInnerStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "24px",
    };

    const noteStyle: React.CSSProperties = {
      fontSize: "28px",
      color: style.accent,
      marginTop: "12px",
      lineHeight: 1.4,
      letterSpacing: "0.5px",
      opacity: 0.8,
    };

    const labelStyle: React.CSSProperties = {
      fontSize: isSquare ? "36px" : "42px",
      fontWeight: 500,
      color: style.text,
      flex: 1,
      letterSpacing: "0.5px",
    };

    const valueStyle = (decision: string): React.CSSProperties => ({
      fontSize: isSquare ? "34px" : "40px",
      fontWeight: 600,
      color: getValueColor(decision),
      textAlign: "right",
      maxWidth: "45%",
      letterSpacing: "0.5px",
    });

    const footerStyle: React.CSSProperties = {
      marginTop: "auto",
      paddingTop: "48px",
      borderTop: `2px solid ${style.divider}`,
      textAlign: "center",
    };

    const footerTextStyle: React.CSSProperties = {
      fontSize: "28px",
      color: style.accent,
      letterSpacing: "1px",
    };

    const VoteIcon = () => (
      <svg 
        width={isSquare ? "64" : "72"} 
        height={isSquare ? "64" : "72"} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={style.iconColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="m9 12 2 2 4-4" />
        <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
        <path d="M22 19H2" />
      </svg>
    );

    return (
      <div ref={ref} style={containerStyle}>
        {data.template === "bold" && (
          <>
            <div style={{
              position: "absolute",
              top: "-20%",
              right: "-20%",
              width: "60%",
              height: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)",
              borderRadius: "50%",
            }} />
            <div style={{
              position: "absolute",
              bottom: "-15%",
              left: "-15%",
              width: "50%",
              height: "40%",
              background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
              borderRadius: "50%",
            }} />
          </>
        )}

        <div style={contentStyle}>
          <div style={headerStyle}>
            <div style={iconContainerStyle}>
              <VoteIcon />
            </div>
            <h1 style={titleStyle}>{electionTitle}</h1>
            <div style={badgeContainerStyle}>
              <span style={badgeStyle}>{electionLevel}</span>
              {electionTypeBadge && (
                <span style={badgeStyle}>{electionTypeBadge}</span>
              )}
            </div>
            <p style={subtitleStyle}>My Voting Decisions</p>
          </div>

          <div style={decisionsContainerStyle}>
            {displayDecisions.map((item, index) => {
              const { label, value } = getDisplayValues(item);
              const isLast = index === displayDecisions.length - 1;
              return (
                <div 
                  key={index} 
                  style={{
                    ...decisionRowStyle,
                    borderBottom: isLast ? "none" : decisionRowStyle.borderBottom,
                  }}
                >
                  <div style={decisionRowInnerStyle}>
                    <span style={labelStyle}>{label}</span>
                    <span style={valueStyle(value)}>{value}</span>
                  </div>
                  {item.note && !isSquare && (
                    <p style={noteStyle}>{item.note}</p>
                  )}
                </div>
              );
            })}
            {visibleDecisions.length > maxDecisions && (
              <p style={{
                fontSize: "32px",
                color: style.accent,
                textAlign: "center",
                paddingTop: "24px",
                letterSpacing: "1px",
              }}>
                +{visibleDecisions.length - maxDecisions} more decisions at link below
              </p>
            )}
          </div>

          <div style={footerStyle}>
            <p style={footerTextStyle}>{displayUrl}</p>
          </div>
        </div>
      </div>
    );
  }
);

DownloadableVoterCard.displayName = "DownloadableVoterCard";

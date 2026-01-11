import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Info, X } from "lucide-react";

interface KeywordDefinition {
  term: string;
  definition: string;
  category?: string;
}

const CIVIC_KEYWORDS: KeywordDefinition[] = [
  {
    term: "ULURP",
    definition: "Uniform Land Use Review Procedure - New York City's standardized procedure for public review of applications affecting land use. It involves multiple city agencies and community boards over a 7-month review period.",
    category: "NYC Process"
  },
  {
    term: "zoning",
    definition: "Government regulations that control how land and buildings can be used in specific areas. Zoning determines what can be built where - residential, commercial, industrial, etc.",
    category: "Land Use"
  },
  {
    term: "eminent domain",
    definition: "The government's power to take private property for public use, with fair compensation to the owner. Often used for infrastructure projects like highways or public buildings.",
    category: "Legal"
  },
  {
    term: "ballot measure",
    definition: "A proposed law or amendment that voters decide on directly, rather than through elected representatives. Also called propositions or referendums.",
    category: "Voting"
  },
  {
    term: "proposition",
    definition: "A ballot measure that proposes a new law or constitutional amendment for voters to approve or reject.",
    category: "Voting"
  },
  {
    term: "referendum",
    definition: "A direct vote by the electorate on a specific proposal or issue. Can be used to approve or overturn laws passed by the legislature.",
    category: "Voting"
  },
  {
    term: "bond",
    definition: "A form of government borrowing where money is raised by selling bonds to investors, then repaid with interest over time. Often used to fund large infrastructure projects.",
    category: "Finance"
  },
  {
    term: "fiscal impact",
    definition: "The estimated financial effect of a proposed law or measure on government budgets, including costs, revenues, and long-term economic effects.",
    category: "Finance"
  },
  {
    term: "amendment",
    definition: "A formal change or addition to a constitution, law, or legal document. Constitutional amendments typically require voter approval.",
    category: "Legal"
  },
  {
    term: "charter",
    definition: "A city's charter is like its constitution - a foundational document that establishes the city government's structure, powers, and procedures.",
    category: "Government"
  },
  {
    term: "appropriation",
    definition: "The allocation of government funds for specific purposes. When a legislature appropriates money, it authorizes spending for particular programs or projects.",
    category: "Finance"
  },
  {
    term: "levy",
    definition: "A tax or fee imposed by the government. A 'levy' can also mean the legal seizure of property to satisfy a debt.",
    category: "Finance"
  },
  {
    term: "special district",
    definition: "A local government unit created for a specific purpose, like a school district, water district, or transit authority. They can collect taxes and provide services.",
    category: "Government"
  },
  {
    term: "quorum",
    definition: "The minimum number of members required to be present for a meeting to conduct official business. Without a quorum, votes typically cannot be held.",
    category: "Government"
  },
  {
    term: "incumbent",
    definition: "The current holder of a political office. Incumbents often have advantages in elections due to name recognition and established campaign resources.",
    category: "Elections"
  },
  {
    term: "primary",
    definition: "An election where voters choose candidates to represent their party in the general election. Primary rules vary by state - some are open to all voters, others only to registered party members.",
    category: "Elections"
  },
  {
    term: "runoff",
    definition: "A second election held when no candidate receives enough votes to win outright in the first round. The top two vote-getters face off in the runoff.",
    category: "Elections"
  },
  {
    term: "general obligation",
    definition: "A type of municipal bond backed by the full faith and credit of the issuing government, including its taxing power. Considered relatively safe investments.",
    category: "Finance"
  },
  {
    term: "EIS",
    definition: "Environmental Impact Statement - A document analyzing the potential environmental effects of a proposed project, required for major federal actions under NEPA.",
    category: "Environment"
  },
  {
    term: "CEQR",
    definition: "City Environmental Quality Review - New York City's process for evaluating the environmental impacts of proposed projects before approval.",
    category: "NYC Process"
  },
];

interface KeywordTooltipProps {
  text: string;
  className?: string;
}

export function KeywordTooltip({ text, className }: KeywordTooltipProps) {
  const [activeKeyword, setActiveKeyword] = useState<KeywordDefinition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-keyword-trigger]')
      ) {
        setActiveKeyword(null);
      }
    };

    if (activeKeyword) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeKeyword]);

  const handleKeywordClick = (keyword: KeywordDefinition, event: React.MouseEvent) => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      const left = Math.min(
        Math.max(rect.left - containerRect.left, 0),
        containerRect.width - 280
      );
      setTooltipPosition({
        top: rect.bottom - containerRect.top + 8,
        left: left
      });
    }
    
    setActiveKeyword(activeKeyword?.term === keyword.term ? null : keyword);
  };

  const highlightKeywords = (inputText: string): (string | JSX.Element)[] => {
    const sortedKeywords = [...CIVIC_KEYWORDS].sort((a, b) => b.term.length - a.term.length);
    const pattern = sortedKeywords.map(k => k.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
    
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(inputText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(inputText.slice(lastIndex, match.index));
      }
      
      const matchedTerm = match[0];
      const keyword = CIVIC_KEYWORDS.find(k => k.term.toLowerCase() === matchedTerm.toLowerCase());
      
      if (keyword) {
        parts.push(
          <button
            key={`${match.index}-${matchedTerm}`}
            type="button"
            data-keyword-trigger
            onClick={(e) => handleKeywordClick(keyword, e)}
            className={cn(
              "inline-flex items-center gap-0.5 px-1 py-0.5 -mx-0.5 rounded",
              "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
              "font-medium cursor-pointer border-b border-dashed border-primary/50",
              activeKeyword?.term === keyword.term && "bg-primary/20 ring-2 ring-primary/30"
            )}
            data-testid={`keyword-${keyword.term.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {matchedTerm}
            <Info className="h-3 w-3 opacity-60" />
          </button>
        );
      } else {
        parts.push(matchedTerm);
      }
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < inputText.length) {
      parts.push(inputText.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : [inputText];
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <span className="leading-relaxed">
        {highlightKeywords(text)}
      </span>
      
      {activeKeyword && tooltipPosition && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-72 p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border animate-in fade-in-0 zoom-in-95"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          data-testid="keyword-tooltip"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-sm">{activeKeyword.term}</h4>
              {activeKeyword.category && (
                <span className="text-xs text-muted-foreground">{activeKeyword.category}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveKeyword(null)}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              data-testid="button-close-tooltip"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {activeKeyword.definition}
          </p>
        </div>
      )}
    </div>
  );
}

export { CIVIC_KEYWORDS };
export type { KeywordDefinition };

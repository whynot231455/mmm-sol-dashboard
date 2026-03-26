import React from 'react';

interface MessageContentProps {
  content: string;
  isAssistant: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, isAssistant }) => {
  const kpiRegex = /(\$?\d+(?:\.\d+)?(?:\s*(?:billion|million|k|m|b|times|x|%|roas|revenue|spend))?)/gi;

  const renderText = (text: string) => {
    // a. Handle Explicit Bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }

      // b. Auto-bold other KPI-like segments if it's the assistant talking
      if (isAssistant) {
        const subParts = part.split(kpiRegex);
        return subParts.map((subPart, j) => {
          if (subPart.match(kpiRegex)) {
            return <strong key={`${i}-${j}`} className="font-bold text-brand-primary">{subPart}</strong>;
          }
          return subPart;
        });
      }

      return part;
    });
  };

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="list-disc pl-6 space-y-2 mb-4 mt-2">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmedLine = line.trim();
    
    // Check for list items (starting with * or -)
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      currentList.push(
        <li key={`li-${i}`} className="leading-relaxed font-medium">
          {renderText(trimmedLine.substring(2))}
        </li>
      );
    } else if (trimmedLine === '') {
      flushList();
      renderedElements.push(<div key={`spacer-${i}`} className="h-2" />);
    } else {
      flushList();
      renderedElements.push(
        <p key={`p-${i}`} className="leading-relaxed font-medium">
          {renderText(line)}
        </p>
      );
    }
  });
  
  flushList(); // Final flush for any trailing list items

  return <div className="space-y-2">{renderedElements}</div>;
};

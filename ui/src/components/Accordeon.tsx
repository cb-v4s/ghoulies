import { useState } from "react";

type Section = {
  title: string;
  content: any;
};

export const Accordeon = ({ sections }: { sections: Section[] }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleSection = (idx: number) => {
    setExpandedIndex(idx === expandedIndex ? null : idx);
  };

  const AccordeonSwitch = ({ isOpen }: { isOpen: boolean }) => {
    return (
      <svg
        data-accordion-icon
        className={`w-3 h-3 ${isOpen ? "" : "rotate-180"} shrink-0`}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 10 6"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 5 5 1 1 5"
        />
      </svg>
    );
  };

  return (
    <div className="mt-3" id="accordion-collapse" data-accordion="collapse">
      {sections && sections.length
        ? sections.map(({ title, content }, idx: number) => (
            <div key={idx}>
              <h2 id="accordion-collapse-heading-1">
                <button
                  type="button"
                  className="flex items-center justify-between w-full py-1 font-medium rtl:text-right text-primary hover:text-slate-300 focus:ring-none outline-none focus:outline-none gap-3 border-b-2 border-primary"
                  data-accordion-target={`#accordion-collapse-body-${idx}`}
                  aria-expanded={idx === expandedIndex}
                  aria-controls={`accordion-collapse-body-${idx}`}
                  onClick={() => toggleSection(idx)}
                >
                  <span className="font-semibold">{title}</span>
                  <AccordeonSwitch isOpen={idx === expandedIndex} />
                </button>
              </h2>
              <div
                id={`accordion-collapse-body-${idx}`}
                className={idx === expandedIndex ? "" : "hidden"}
                aria-labelledby={`accordion-collapse-heading-${idx}`}
              >
                <div className="py-2">{content()}</div>
              </div>
            </div>
          ))
        : null}
    </div>
  );
};

import React from "react";
import { links } from "../siteConfig";

export const Footer: React.FC<any> = () => {
  return (
    <footer className="text-white text-center font-semibold select-none text-sm">
      <p className="text-center text-sm leading-loose">
        Built by{" "}
        <a
          href={links.githubProfile}
          target="_blank"
          rel="noreferrer"
          className="font-sm underline underline-offset-4"
        >
          Carlos Barrios
        </a>
        . Source code available on{" "}
        <a
          href={links.sourceCode}
          target="_blank"
          rel="noreferrer"
          className="font-sm underline underline-offset-4"
        >
          GitHub
        </a>
        .
      </p>
    </footer>
  );
};
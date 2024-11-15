import React from "react";
import { links } from "../siteConfig";

export const Footer: React.FC<any> = () => {
  return (
    <footer className="text-white text-center select-none text-sm font-light mt-10">
      <p className="text-center text-sm leading-loose">
        © Ghosties 2024. Built by{" "}
        <a
          href={links.githubProfile}
          target="_blank"
          rel="noreferrer"
          className="font-sm underline underline-offset-4"
        >
          Carlos Barrios
        </a>
        .
      </p>
    </footer>
  );
};

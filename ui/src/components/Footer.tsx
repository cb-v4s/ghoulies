import React from "react";
import { links, githubName, appName } from "@/siteConfig";
import { capitalize } from "@/lib/misc";

export const Footer: React.FC<any> = () => {
  return (
    <footer className="text-primary text-center select-none text-sm font-light mt-10">
      <p className="text-center text-sm leading-loose">
        © {capitalize(appName)} 2024. Built by{" "}
        <a
          href={links.githubProfile}
          target="_blank"
          rel="noreferrer"
          className="font-sm underline underline-offset-4"
        >
          {githubName}
        </a>
        .
      </p>
    </footer>
  );
};

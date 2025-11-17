export default function Authors({ date, children, by = "by" }) {
  return (
    <div className="mt-4 mb-16 text-gray-500 text-sm">
      {date} {by} {children}
    </div>
  );
}

export function Author({ name, link }) {
  return (
    <span className="after:content-[','] last:after:content-['']">
      <a
        key={name}
        href={link}
        target="_blank"
        // style={{ textUnderlinePosition: "under" }}
        className="mx-1 text-current underline [text-underline-position:from-font] decoration-from-font"
      >
        {name}
      </a>
    </span>
  );
}

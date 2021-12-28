import { useEffect, useState } from "react";
import { LABELS } from "../constants";

export function useIsUrl(url: string) {
  return !!url.match(urlRegex);
}
const urlRegex =
  // eslint-disable-next-line
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export function useLoadGist(gistLink: string) {
  const isUrl = useIsUrl(gistLink);
  const isGist =
    !!gistLink.match(/gist/i) &&
    !!gistLink.match(/github/i);
  const [content, setContent] = useState(gistLink);
  const [loading, setLoading] = useState(isUrl);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let isCancelled = false;
    if (loading) {
      let toFetch = gistLink;
      const pieces = toFetch.match(urlRegex);
      if (isGist && pieces) {
        const justIdWithoutUser = pieces[1].split('/')[2];
        toFetch = 'https://api.github.com/gists/' + justIdWithoutUser;
      }
      fetch(toFetch)
        .then(async resp => {
          if (!isCancelled) {
            if (resp.status === 200) {
              if (isGist) {
                const jsonContent = await resp.json();
                const nextUrlFileName = Object.keys(jsonContent['files'])[0];
                const nextUrl = jsonContent['files'][nextUrlFileName]['raw_url'];
                fetch(nextUrl).then(async response => {
                  if (!isCancelled) {
                    setContent(await response.text())
                  }
                });
              } else {
                setContent(await resp.text())
              }
            } else {
              if (resp.status === 403 && isGist) {
                setMsg(LABELS.GIT_CONTENT_EXCEEDED);
              }
              setFailed(true);
            }
            setLoading(false);
          }
        })
        .catch(_ => {
          if (!isCancelled) {
            setFailed(true);
            setLoading(false);
          }
        });
    }
    return () => { isCancelled = true; }
  }, [gistLink]); //eslint-disable-line
  return {
    loading,
    failed,
    msg,
    content,
    isGist,
    isUrl,
  }
}
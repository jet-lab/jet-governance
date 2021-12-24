import { utcTickInterval } from "d3-time";
import { useMemo } from "react";
import { LABELS } from "../constants";
import { ParsedAccount } from "../contexts";
import { Proposal } from "../models/accounts";

export function useIsUrl(url: string) {
  return !!url.match(urlRegex);
}
const urlRegex =
  // eslint-disable-next-line
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export function useLoadGist({
  loading,
  setLoading,
  setFailed,
  setMsg,
  setContent,
  isGist,
  proposal,
}: {
  loading: boolean;
  setLoading: (b: boolean) => void;
  setMsg: (b: string) => void;
  setFailed: (b: boolean) => void;
  setContent: (b: string) => void;
  isGist: boolean;
  proposal: ParsedAccount<Proposal>;
}) {
  useMemo(() => {
    if (loading) {
      let toFetch = proposal.info.descriptionLink;
      const pieces = toFetch.match(urlRegex);
      if (isGist && pieces) {
        const justIdWithoutUser = pieces[1].split('/')[2];
        toFetch = 'https://api.github.com/gists/' + justIdWithoutUser;
      }
      fetch(toFetch)
        .then(async resp => {
          if (resp.status === 200) {
            if (isGist) {
              const jsonContent = await resp.json();
              const nextUrlFileName = Object.keys(jsonContent['files'])[0];
              const nextUrl = jsonContent['files'][nextUrlFileName]['raw_url'];
              fetch(nextUrl).then(async response =>
                setContent(await response.text()),
              );
            } else setContent(await resp.text());
          } else {
            if (resp.status === 403 && isGist)
              setMsg(LABELS.GIT_CONTENT_EXCEEDED);
            setFailed(true);
          }
          setLoading(false);
        })
        .catch(_ => {
          setFailed(true);
          setLoading(false);
        });
    }
  }, [loading]); //eslint-disable-line
}
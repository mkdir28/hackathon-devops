import type { JobBoardDefinition, RawJobListing } from '../types.js';
import { config } from '../../config.js';
import { encodeQuery, fetchHtml } from './http.js';
import { parseBoardHtml } from './parsers.js';

export async function fetchJobBoard(
  board: JobBoardDefinition,
  query: string
): Promise<RawJobListing[]> {
  if (board.parser === 'web-only' || !board.searchUrlTemplate) {
    return [];
  }

  const url = board.searchUrlTemplate.replace(
    '{query}',
    encodeQuery(query).replace(/%20/g, '+')
  );

  const html = await fetchHtml(url, config.jobSearchFetchTimeoutMs);
  return parseBoardHtml(html, board, config.jobSearchResultsPerBoard);
}

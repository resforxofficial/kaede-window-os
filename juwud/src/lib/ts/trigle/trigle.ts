import { members } from "#lib/content/members.ts";
export type SearchCategory = "member" | "gallery" | "music" | "archive";

type SearchConcept = {
    id: string;
    aliases: string[];
};

const SEARCH_CONCEPTS: SearchConcept[] = [
    {
        id: "member",
        aliases: ["멤버", "멤버들", "구성원", "member", "members", "24명", "24인"],
    },
    {
        id: "gallery",
        aliases: [
            "갤러리",
            "사진",
            "사진첩",
            "포토",
            "이미지",
            "gallery",
            "photo",
            "photos",
            "image",
        ],
    },
    {
        id: "music",
        aliases: [
            "음악",
            "노래",
            "곡",
            "앨범",
            "수록곡",
            "디스코그래피",
            "music",
            "song",
            "songs",
            "album",
            "albums",
            "discography",
        ],
    },
    {
        id: "archive",
        aliases: [
            "활동",
            "기록",
            "아카이브",
            "이력",
            "연혁",
            "archive",
            "history",
            "activity",
            "activities",
        ],
    },
    {
        id: "profile",
        aliases: [
            "프로필",
            "소개",
            "인물정보",
            "profile",
            "introduction",
            "information",
        ],
    },
];

// 의미가 약해서 검색 조건에서 제외할 표현
const STOP_WORDS = new Set([
    "전체",
    "모든",
    "모두",
    "전원",
    "목록",
    "리스트",
    "보기",
    "검색",
    "찾기",
    "관련",
    "페이지",
    "정보",

    "the",
    "all",
    "list",
    "show",
]);

export interface SearchDocument {
    id: string;
    title: string;
    description: string;
    url: string;
    category: SearchCategory;
    keywords: string[];
    memberId?: string;
}

const memberDocuments: SearchDocument[] = members.map((member) => ({
    id: `member-${member.id}`,
    title: member.name,
    description: `S${member.sNumber} · ${member.koreanName} · tripleS 멤버 프로필`,
    url: `tri://members/${member.id}`,
    category: "member",

    keywords: [
        member.name,
        member.koreanName,
        ...member.aliases,
        `S${member.sNumber}`,
        `S${String(member.sNumber).padStart(2, "0")}`,
        "tripleS",
        "멤버",
        "프로필",
    ],

    memberId: member.id,
}));

const memberDocumentMap = new Map<string, SearchDocument>();
for (const memberDocument of memberDocuments) {
    if (memberDocument.memberId) {
        memberDocumentMap.set(memberDocument.memberId, memberDocument);
    }
}

// -------------------------
// Other Search Documents
// -------------------------

const otherDocuments: SearchDocument[] = [
    {
        id: "gallery",
        title: "사진 갤러리",
        description: "사진 및 이미지 아카이브",
        url: "tri://gallery",
        category: "gallery",
        keywords: ["사진", "갤러리", "이미지", "포토", "photo"],
    },
    {
        id: "music",
        title: "음악 및 앨범",
        description: "tripleS의 앨범과 수록곡 정보",
        url: "tri://music",
        category: "music",
        keywords: ["음악", "앨범", "노래", "수록곡", "music", "album"],
    },
    {
        id: "archive",
        title: "활동 아카이브",
        description: "활동 및 관련 기록",
        url: "tri://archive",
        category: "archive",
        keywords: ["활동", "기록", "아카이브", "archive", "history"],
    },
];

const galleryDocuments: SearchDocument[] = memberDocuments
    .filter((doc) => doc.memberId)
    .map((memberDoc) => ({
        id: `gallery-${memberDoc.memberId!.toLowerCase()}`,
        title: `${memberDoc.title} 사진 갤러리`,
        description: `${memberDoc.title}의 tripleS 사진 갤러리`,
        url: `tri://gallery/${memberDoc.memberId!.toLowerCase()}`,
        category: "gallery",
        memberId: memberDoc.memberId,
        keywords: ["사진", "갤러리", "이미지", "포토", "photo", "image"],
    }));

// -------------------------
// Search Index
// -------------------------

// 현재는 테스트용 기본 데이터.
// 실제 팬 콘텐츠를 만들 때 데이터만 교체하면 됨.
export const searchIndex: SearchDocument[] = [
    ...memberDocuments,
    ...otherDocuments,
    ...galleryDocuments,
];

// -------------------------
// Search Helpers
// -------------------------

function normalize(value: string): string {
    return value
        .normalize("NFKC")
        .toLocaleLowerCase("ko-KR")
        .replace(/\bs\s+0?(\d{1,2})\b/g, "s$1")
        .trim();
}

function normalizeQuery(query: string): string {
    let normalized = normalize(query);

    // 한국어 복합 검색 표현 정규화
    const phrasePatterns: RegExp[] = [
        /전체\s*멤버/gi,
        /모든\s*멤버/gi,
        /멤버\s*(?:목록|리스트|전원)/gi,

        /전체\s*구성원/gi,
        /모든\s*구성원/gi,

        /tripleS\s*멤버/gi,
    ];

    for (const pattern of phrasePatterns) {
        normalized = normalized.replace(pattern, " 멤버 ");
    }

    // 영어 복합 검색 표현 정규화
    normalized = normalized.replace(
        /\ball\s+members?\b|\bmembers?\s+list\b/gi,
        " member ",
    );

    return normalized
        .split(/\s+/)
        .filter(Boolean)
        .filter((term) => !STOP_WORDS.has(term))
        .join(" ");
}

// 검색어에 대응하는 동의어 반환
function getSearchAliases(term: string): string[] {
    const concept = SEARCH_CONCEPTS.find((item) =>
        item.aliases.some((alias) => normalize(alias) === term),
    );

    return concept?.aliases.map(normalize) ?? [term];
}

// -------------------------
// Search Engine
// -------------------------
function getTermScore(doc: SearchDocument, term: string): number {
    // 현재 검색 문서와 연결된 멤버 문서
    const linkedMemberDocument = doc.memberId ? memberDocumentMap.get(doc.memberId) : undefined;
    // 검색 대상 제목
    const titleTexts = [doc.title, linkedMemberDocument?.title ?? ""].map((text) => text.toLowerCase());
    // 검색 대상 설명
    const descriptionTexts = [doc.description, linkedMemberDocument?.description ?? "",].map((text) => text.toLowerCase());

    // 검색 대상 키워드
    const keywordTexts = [
        ...doc.keywords,
        ...(linkedMemberDocument?.keywords ?? []),
    ].map((keyword) => keyword.toLowerCase());

    // 검색 대상 카테고리 및 URL
    const categoryText = doc.category.toLowerCase();
    const urlText = doc.url.toLowerCase();

    // 검색어에 해당하는 동의어 목록
    const aliases = getSearchAliases(term);
    // 동의어가 없으면 원래 검색어 사용
    const candidateTerms = aliases.length > 0 ? aliases : [term];

    let bestScore = 0;
    for (const candidate of candidateTerms) {
        const normalizedCandidate = candidate.toLowerCase();

        let candidateScore = 0;

        // 제목 점수
        if (titleTexts.some((title) => title === normalizedCandidate)) {
            candidateScore += 30;
        } else if (
            titleTexts.some((title) => title.includes(normalizedCandidate))
        ) {
            candidateScore += 15;
        }

        // 키워드 점수
        if (keywordTexts.includes(normalizedCandidate)) {
            candidateScore += 20;
        } else if (
            keywordTexts.some((keyword) => keyword.includes(normalizedCandidate))
        ) {
            candidateScore += 10;
        }

        // 카테고리 점수
        if (categoryText === normalizedCandidate) {
            candidateScore += 12;
        }

        // 설명 점수
        if (descriptionTexts.some((description) => description.includes(normalizedCandidate))) {
            candidateScore += 3;
        }

        // URL 점수
        if (urlText.includes(normalizedCandidate)) {
            candidateScore += 5;
        }

        bestScore = Math.max(bestScore, candidateScore);
    }

    return bestScore;
}

export function searchContent(query: string): SearchDocument[] {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return [];

    const terms = normalizedQuery.split(/\s+/);
    const result = searchIndex
        .map((docu) => {
            let score = 0;
            for (const term of terms) {
                const termScore = getTermScore(docu, term);
                if (termScore === 0) {
                    return { docu, score: 0 };
                }

                score += termScore;
            }

            return { docu, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => {
            return (
                b.score - a.score || a.docu.title.localeCompare(b.docu.title, "ko")
            );
        });

    return result.map((item) => item.docu);
}

// -------------------------
// Category Labels
// -------------------------

export const categoryLabels: Record<SearchCategory, string> = {
    member: "멤버",
    gallery: "갤러리",
    music: "음악",
    archive: "아카이브",
};

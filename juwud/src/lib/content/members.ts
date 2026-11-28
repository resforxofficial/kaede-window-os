export interface Member {
    id: string;
    sNumber: number;
    name: string;
    koreanName: string;
    aliases: string[];
}

export const members: Member[] = [
    {
        id: "s1",
        sNumber: 1,
        name: "SeoYeon",
        koreanName: "윤서연",
        aliases: ["S1"],
    },
    {
        id: "s2",
        sNumber: 2,
        name: "HyeRin",
        koreanName: "정혜린",
        aliases: ["S2"],
    },
    {
        id: "s3",
        sNumber: 3,
        name: "JiWoo",
        koreanName: "이지우",
        aliases: ["S3"],
    },
    {
        id: "s4",
        sNumber: 4,
        name: "ChaeYeon",
        koreanName: "김채연",
        aliases: ["S4"],
    },
    {
        id: "s5",
        sNumber: 5,
        name: "YooYeon",
        koreanName: "김유연",
        aliases: ["S5"],
    },
    {
        id: "s6",
        sNumber: 6,
        name: "SooMin",
        koreanName: "김수민",
        aliases: ["S6"],
    },
    {
        id: "s7",
        sNumber: 7,
        name: "NaKyoung",
        koreanName: "김나경",
        aliases: ["S7"],
    },
    {
        id: "s8",
        sNumber: 8,
        name: "YuBin",
        koreanName: "공유빈",
        aliases: ["S8"],
    },
    {
        id: "s9",
        sNumber: 9,
        name: "Kaede",
        koreanName: "카에데",
        aliases: ["S9"],
    },
    {
        id: "s10",
        sNumber: 10,
        name: "DaHyun",
        koreanName: "서다현",
        aliases: ["S10"],
    },
    {
        id: "s11",
        sNumber: 11,
        name: "Kotone",
        koreanName: "코토네",
        aliases: ["S11"],
    },
    {
        id: "s12",
        sNumber: 12,
        name: "YeonJi",
        koreanName: "곽연지",
        aliases: ["S12"],
    },
    {
        id: "s13",
        sNumber: 13,
        name: "Nien",
        koreanName: "니엔",
        aliases: ["S13"],
    },
    {
        id: "s14",
        sNumber: 14,
        name: "SoHyun",
        koreanName: "박소현",
        aliases: ["S14"],
    },
    {
        id: "s15",
        sNumber: 15,
        name: "Xinyu",
        koreanName: "신위",
        aliases: ["S15"],
    },
    {
        id: "s16",
        sNumber: 16,
        name: "Mayu",
        koreanName: "마유",
        aliases: ["S16"],
    },
    {
        id: "s17",
        sNumber: 17,
        name: "Lynn",
        koreanName: "린",
        aliases: ["S17"],
    },
    {
        id: "s18",
        sNumber: 18,
        name: "JooBin",
        koreanName: "주빈",
        aliases: ["S18"],
    },
    {
        id: "s19",
        sNumber: 19,
        name: "HaYeon",
        koreanName: "정하연",
        aliases: ["S19"],
    },
    {
        id: "s20",
        sNumber: 20,
        name: "ShiOn",
        koreanName: "박시온",
        aliases: ["S20"],
    },
    {
        id: "s21",
        sNumber: 21,
        name: "ChaeWon",
        koreanName: "김채원",
        aliases: ["S21"],
    },
    {
        id: "s22",
        sNumber: 22,
        name: "Sullin",
        koreanName: "설린",
        aliases: ["S22"],
    },
    {
        id: "s23",
        sNumber: 23,
        name: "SeoAh",
        koreanName: "서아",
        aliases: ["S23"],
    },
    {
        id: "s24",
        sNumber: 24,
        name: "JiYeon",
        koreanName: "지연",
        aliases: ["S24"],
    },
];

export function getMemberById(id: string): Member | undefined {
    return members.find((member) => member.id === id);
}

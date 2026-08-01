export interface DictionaryEntry {
  chinese: string;
  pinyin: string;
  thai: string;
  example?: string;
  examplePinyin?: string;
  exampleThai?: string;
}

// Small built-in Chinese–Thai dictionary used to power the mock OCR/translation
// pipeline and the demo deck. Replace with a real dictionary/API call in production —
// see services/translationService.ts and services/pinyinService.ts.
export const DICTIONARY: DictionaryEntry[] = [
  { chinese: "亭子多有围墙", pinyin: "tíngzi duō yǒu wéiqiáng", thai: "ศาลาส่วนใหญ่มักมีกำแพงล้อม" },
  { chinese: "亭子多有圍牆", pinyin: "tíngzi duō yǒu wéiqiáng", thai: "ศาลาส่วนใหญ่มักมีกำแพงล้อม" },
  { chinese: "学习", pinyin: "xuéxí", thai: "เรียน / ศึกษา", example: "我每天学习中文。", examplePinyin: "Wǒ měitiān xuéxí Zhōngwén.", exampleThai: "ฉันเรียนภาษาจีนทุกวัน" },
  { chinese: "工作", pinyin: "gōngzuò", thai: "ทำงาน / งาน", example: "他在银行工作。", examplePinyin: "Tā zài yínháng gōngzuò.", exampleThai: "เขาทำงานที่ธนาคาร" },
  { chinese: "朋友", pinyin: "péngyou", thai: "เพื่อน", example: "她是我最好的朋友。", examplePinyin: "Tā shì wǒ zuì hǎo de péngyou.", exampleThai: "เธอเป็นเพื่อนที่ดีที่สุดของฉัน" },
  { chinese: "谢谢", pinyin: "xièxie", thai: "ขอบคุณ", example: "谢谢你的帮助。", examplePinyin: "Xièxie nǐ de bāngzhù.", exampleThai: "ขอบคุณสำหรับความช่วยเหลือ" },
  { chinese: "你好", pinyin: "nǐ hǎo", thai: "สวัสดี", example: "你好,很高兴认识你。", examplePinyin: "Nǐ hǎo, hěn gāoxìng rènshi nǐ.", exampleThai: "สวัสดี ยินดีที่ได้รู้จัก" },
  { chinese: "老师", pinyin: "lǎoshī", thai: "ครู / อาจารย์", example: "我的老师很有耐心。", examplePinyin: "Wǒ de lǎoshī hěn yǒu nàixīn.", exampleThai: "ครูของฉันใจเย็นมาก" },
  { chinese: "学生", pinyin: "xuésheng", thai: "นักเรียน / นักศึกษา", example: "他是一名大学生。", examplePinyin: "Tā shì yī míng dàxuéshēng.", exampleThai: "เขาเป็นนักศึกษามหาวิทยาลัย" },
  { chinese: "吃饭", pinyin: "chīfàn", thai: "กินข้าว", example: "我们一起吃饭吧。", examplePinyin: "Wǒmen yīqǐ chīfàn ba.", exampleThai: "เรามากินข้าวด้วยกันเถอะ" },
  { chinese: "喝水", pinyin: "hēshuǐ", thai: "ดื่มน้ำ", example: "多喝水对身体好。", examplePinyin: "Duō hēshuǐ duì shēntǐ hǎo.", exampleThai: "ดื่มน้ำเยอะๆ ดีต่อร่างกาย" },
  { chinese: "旅行", pinyin: "lǚxíng", thai: "การเดินทาง / ท่องเที่ยว", example: "我喜欢一个人旅行。", examplePinyin: "Wǒ xǐhuan yī gè rén lǚxíng.", exampleThai: "ฉันชอบเดินทางคนเดียว" },
  { chinese: "家庭", pinyin: "jiātíng", thai: "ครอบครัว", example: "家庭对我来说很重要。", examplePinyin: "Jiātíng duì wǒ láishuō hěn zhòngyào.", exampleThai: "ครอบครัวสำคัญมากสำหรับฉัน" },
  { chinese: "健康", pinyin: "jiànkāng", thai: "สุขภาพ / แข็งแรง", example: "健康比什么都重要。", examplePinyin: "Jiànkāng bǐ shénme dōu zhòngyào.", exampleThai: "สุขภาพสำคัญกว่าสิ่งอื่นใด" },
  { chinese: "天气", pinyin: "tiānqì", thai: "อากาศ", example: "今天天气很好。", examplePinyin: "Jīntiān tiānqì hěn hǎo.", exampleThai: "วันนี้อากาศดีมาก" },
  { chinese: "时间", pinyin: "shíjiān", thai: "เวลา", example: "时间过得真快。", examplePinyin: "Shíjiān guò de zhēn kuài.", exampleThai: "เวลาผ่านไปเร็วจริงๆ" },
  { chinese: "电影", pinyin: "diànyǐng", thai: "ภาพยนตร์ / หนัง", example: "我们去看电影吧。", examplePinyin: "Wǒmen qù kàn diànyǐng ba.", exampleThai: "เราไปดูหนังกันเถอะ" },
  { chinese: "音乐", pinyin: "yīnyuè", thai: "ดนตรี / เพลง", example: "她喜欢听音乐。", examplePinyin: "Tā xǐhuan tīng yīnyuè.", exampleThai: "เธอชอบฟังเพลง" },
  { chinese: "咖啡", pinyin: "kāfēi", thai: "กาแฟ", example: "我早上喝咖啡。", examplePinyin: "Wǒ zǎoshang hē kāfēi.", exampleThai: "ฉันดื่มกาแฟตอนเช้า" },
  { chinese: "书店", pinyin: "shūdiàn", thai: "ร้านหนังสือ", example: "附近有一家书店。", examplePinyin: "Fùjìn yǒu yī jiā shūdiàn.", exampleThai: "แถวนี้มีร้านหนังสือ" },
  { chinese: "医院", pinyin: "yīyuàn", thai: "โรงพยาบาล", example: "他去医院看病。", examplePinyin: "Tā qù yīyuàn kànbìng.", exampleThai: "เขาไปโรงพยาบาลเพื่อตรวจโรค" },
  { chinese: "机场", pinyin: "jīchǎng", thai: "สนามบิน", example: "我们在机场见面。", examplePinyin: "Wǒmen zài jīchǎng jiànmiàn.", exampleThai: "เราจะเจอกันที่สนามบิน" },
  { chinese: "美丽", pinyin: "měilì", thai: "สวยงาม", example: "这个地方很美丽。", examplePinyin: "Zhège dìfang hěn měilì.", exampleThai: "ที่นี่สวยงามมาก" },
  { chinese: "快乐", pinyin: "kuàilè", thai: "มีความสุข", example: "祝你生日快乐。", examplePinyin: "Zhù nǐ shēngrì kuàilè.", exampleThai: "ขอให้มีความสุขในวันเกิด" },
  { chinese: "努力", pinyin: "nǔlì", thai: "พยายาม / ขยัน", example: "他一直很努力。", examplePinyin: "Tā yīzhí hěn nǔlì.", exampleThai: "เขาพยายามมาโดยตลอด" },
  { chinese: "梦想", pinyin: "mèngxiǎng", thai: "ความฝัน", example: "每个人都有梦想。", examplePinyin: "Měi gè rén dōu yǒu mèngxiǎng.", exampleThai: "ทุกคนมีความฝัน" },
];

export function findDictionaryEntry(chinese: string): DictionaryEntry | undefined {
  return DICTIONARY.find((d) => d.chinese === chinese);
}

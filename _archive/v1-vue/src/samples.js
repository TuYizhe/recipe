// 示例菜谱：第一次打开时可一键载入，方便看效果
const day = 86400000
export const SAMPLES = [
  {
    name: '番茄炒蛋', category: '家常菜', servings: '2人份',
    sourceUrl: 'https://www.bilibili.com/',
    ingredients: [
      { group: 'main', name: '番茄', amount: '2 个' },
      { group: 'main', name: '鸡蛋', amount: '3 个' },
      { group: 'side', name: '小葱', amount: '1 根' },
      { group: 'seasoning', name: '盐', amount: '1 小勺' },
      { group: 'seasoning', name: '白糖', amount: '1 小勺' },
      { group: 'seasoning', name: '番茄酱', amount: '1 大勺' },
      { group: 'seasoning', name: '食用油', amount: '2 大勺' }
    ],
    steps: [
      { text: '番茄顶部划十字，开水烫 30 秒去皮，切块。鸡蛋加少许盐打散。', heat: '', time: '' },
      { text: '热锅多放油，油热后倒入蛋液，凝固后立刻划散盛出。', heat: '大火', time: '30秒' },
      { text: '锅里留底油，下番茄翻炒出汁，加番茄酱和白糖。', heat: '中火', time: '2分钟' },
      { text: '倒回鸡蛋，加盐翻匀，撒葱花出锅。', heat: '中火', time: '30秒' }
    ],
    tips: '蛋液刚凝固就盛出，别炒老；番茄汁多才好吃，不够可以加两勺清水。',
    logs: [{ date: Date.now() - 18 * day, rating: 4, note: '这次盐放多了一点，下次盐减到半小勺。', imageIds: [] }]
  },
  {
    name: '可乐鸡翅', category: '家常菜', servings: '2人份',
    sourceUrl: 'https://www.xiaohongshu.com/',
    ingredients: [
      { group: 'main', name: '鸡翅中', amount: '10 个' },
      { group: 'main', name: '可乐', amount: '1 罐' },
      { group: 'side', name: '姜', amount: '3 片' },
      { group: 'seasoning', name: '生抽', amount: '2 大勺' },
      { group: 'seasoning', name: '老抽', amount: '1 小勺' },
      { group: 'seasoning', name: '料酒', amount: '1 大勺' }
    ],
    steps: [
      { text: '鸡翅两面各划两刀，冷水下锅加姜片和料酒焯水，捞出擦干。', heat: '大火', time: '3分钟' },
      { text: '少油把鸡翅两面煎到金黄。', heat: '中火', time: '4分钟' },
      { text: '倒入可乐没过鸡翅，加生抽、老抽。', heat: '大火', time: '' },
      { text: '烧开后转小火炖，最后开大火收汁。', heat: '小火', time: '15分钟' }
    ],
    tips: '收汁时要一直翻，糖分高容易糊。',
    logs: []
  },
  {
    name: '酸辣土豆丝', category: '家常菜', servings: '2人份',
    sourceUrl: '',
    ingredients: [
      { group: 'main', name: '土豆', amount: '1 个' },
      { group: 'side', name: '干辣椒', amount: '4 个' },
      { group: 'side', name: '蒜', amount: '2 瓣' },
      { group: 'seasoning', name: '白醋', amount: '2 大勺' },
      { group: 'seasoning', name: '盐', amount: '半小勺' },
      { group: 'seasoning', name: '花椒', amount: '少许' }
    ],
    steps: [
      { text: '土豆切细丝，清水泡掉淀粉，换水两次后沥干。', heat: '', time: '10分钟' },
      { text: '热油小火炸香花椒后捞出，下干辣椒和蒜片。', heat: '小火', time: '' },
      { text: '下土豆丝快速翻炒，沿锅边淋一半白醋。', heat: '大火', time: '1分钟' },
      { text: '加盐和剩下的醋，翻匀出锅。', heat: '大火', time: '30秒' }
    ],
    tips: '全程大火快炒才脆；醋分两次放。',
    logs: [{ date: Date.now() - 64 * day, rating: 5, note: '很成功，脆！', imageIds: [] }]
  },
  {
    name: '玉米排骨汤', category: '汤羹', servings: '3人份',
    sourceUrl: '',
    ingredients: [
      { group: 'main', name: '排骨', amount: '500 克' },
      { group: 'main', name: '玉米', amount: '1 根' },
      { group: 'side', name: '胡萝卜', amount: '1 根' },
      { group: 'side', name: '姜', amount: '3 片' },
      { group: 'seasoning', name: '盐', amount: '1 小勺' }
    ],
    steps: [
      { text: '排骨冷水下锅焯水，撇去浮沫，捞出洗净。', heat: '大火', time: '5分钟' },
      { text: '砂锅加足量热水、排骨、姜片，烧开转小火。', heat: '小火', time: '40分钟' },
      { text: '放玉米和胡萝卜继续炖。', heat: '小火', time: '20分钟' },
      { text: '出锅前加盐调味。', heat: '', time: '' }
    ],
    tips: '中途不要加冷水，汤会变浑。',
    logs: []
  }
]

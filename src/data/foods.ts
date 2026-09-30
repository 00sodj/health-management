import type { FoodItem } from '@/types'

/**
 * 内置常见食物库：每 100g 的热量(kcal)、蛋白质(g)、碳水(g)、脂肪(g)。
 * units 为可选单位，grams 表示该单位对应的克数；'g' 单位 grams=1。
 * 覆盖主食 / 蛋白 / 海鲜 / 豆制品 / 蔬菜 / 水果 / 坚果 / 零食 / 饮品 / 快餐 / 调味，共 75 种。
 */
export const DEFAULT_FOODS: FoodItem[] = [
  // ===== 主食 / 碳水 =====
  { id: 'rice', name: '米饭(熟)', category: '主食', per100g: { kcal: 116, protein: 2.6, carbs: 25.9, fat: 0.3 }, units: [{ name: 'g', grams: 1 }, { name: '碗', grams: 150 }, { name: '份', grams: 100 }], defaultUnit: '碗' },
  { id: 'mantou', name: '馒头', category: '主食', per100g: { kcal: 223, protein: 7, carbs: 47, fat: 1.1 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 80 }], defaultUnit: '个' },
  { id: 'bread', name: '全麦面包', category: '主食', per100g: { kcal: 246, protein: 9, carbs: 41, fat: 4 }, units: [{ name: 'g', grams: 1 }, { name: '片', grams: 40 }], defaultUnit: '片' },
  { id: 'oats', name: '燕麦', category: '主食', per100g: { kcal: 389, protein: 16.9, carbs: 66, fat: 6.9 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 30 }], defaultUnit: '份' },
  { id: 'noodles', name: '面条(熟)', category: '主食', per100g: { kcal: 138, protein: 4.5, carbs: 25, fat: 1 }, units: [{ name: 'g', grams: 1 }, { name: '碗', grams: 200 }], defaultUnit: '碗' },
  { id: 'potato', name: '土豆', category: '主食', per100g: { kcal: 77, protein: 2, carbs: 17, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 150 }], defaultUnit: '个' },
  { id: 'sweetpotato', name: '红薯', category: '主食', per100g: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 150 }], defaultUnit: '个' },
  { id: 'purplesweet', name: '紫薯', category: '主食', per100g: { kcal: 99, protein: 1.9, carbs: 24, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 150 }], defaultUnit: '个' },
  { id: 'corn', name: '玉米', category: '主食', per100g: { kcal: 112, protein: 4, carbs: 22, fat: 1.2 }, units: [{ name: 'g', grams: 1 }, { name: '根', grams: 150 }], defaultUnit: '根' },
  { id: 'millet', name: '小米粥', category: '主食', per100g: { kcal: 46, protein: 1.4, carbs: 9, fat: 0.5 }, units: [{ name: 'g', grams: 1 }, { name: '碗', grams: 250 }], defaultUnit: '碗' },
  { id: 'pasta', name: '意面(熟)', category: '主食', per100g: { kcal: 158, protein: 5.8, carbs: 31, fat: 0.9 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 150 }], defaultUnit: '份' },
  { id: 'ricecake', name: '年糕', category: '主食', per100g: { kcal: 156, protein: 3, carbs: 34, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 100 }], defaultUnit: '块' },
  { id: 'shaobing', name: '烧饼', category: '主食', per100g: { kcal: 300, protein: 8, carbs: 50, fat: 8 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 80 }], defaultUnit: '个' },
  { id: 'youtiao', name: '油条', category: '主食', per100g: { kcal: 386, protein: 6, carbs: 51, fat: 19 }, units: [{ name: 'g', grams: 1 }, { name: '根', grams: 60 }], defaultUnit: '根' },
  { id: 'quinoa', name: '藜麦', category: '主食', per100g: { kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 30 }], defaultUnit: '份' },
  { id: 'bun', name: '包子(肉)', category: '主食', per100g: { kcal: 227, protein: 11, carbs: 29, fat: 8 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 100 }], defaultUnit: '个' },
  { id: 'dumpling', name: '饺子', category: '主食', per100g: { kcal: 198, protein: 8, carbs: 25, fat: 7 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 20 }], defaultUnit: '个' },

  // ===== 蛋白质 / 肉蛋奶豆 =====
  { id: 'egg', name: '鸡蛋', category: '蛋白', per100g: { kcal: 144, protein: 13, carbs: 1, fat: 9 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 50 }], defaultUnit: '个' },
  { id: 'quailegg', name: '鹌鹑蛋', category: '蛋白', per100g: { kcal: 160, protein: 13, carbs: 2.5, fat: 11 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 10 }], defaultUnit: '个' },
  { id: 'duckegg', name: '鸭蛋', category: '蛋白', per100g: { kcal: 180, protein: 13, carbs: 2, fat: 13 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 70 }], defaultUnit: '个' },
  { id: 'chicken', name: '鸡胸肉', category: '蛋白', per100g: { kcal: 133, protein: 24, carbs: 0, fat: 5 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'beef', name: '牛肉(瘦)', category: '蛋白', per100g: { kcal: 125, protein: 26, carbs: 0, fat: 3.5 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'pork', name: '猪肉(瘦)', category: '蛋白', per100g: { kcal: 143, protein: 21, carbs: 1, fat: 6 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'duck', name: '鸭肉', category: '蛋白', per100g: { kcal: 240, protein: 16, carbs: 0, fat: 19 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'lamb', name: '羊肉', category: '蛋白', per100g: { kcal: 203, protein: 19, carbs: 0, fat: 14 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'bacon', name: '培根', category: '蛋白', per100g: { kcal: 541, protein: 37, carbs: 1.4, fat: 42 }, units: [{ name: 'g', grams: 1 }, { name: '片', grams: 15 }], defaultUnit: '片' },
  { id: 'ham', name: '火腿', category: '蛋白', per100g: { kcal: 145, protein: 16, carbs: 1.5, fat: 9 }, units: [{ name: 'g', grams: 1 }, { name: '片', grams: 20 }], defaultUnit: '片' },
  { id: 'sausage', name: '香肠', category: '蛋白', per100g: { kcal: 300, protein: 12, carbs: 5, fat: 27 }, units: [{ name: 'g', grams: 1 }, { name: '根', grams: 40 }], defaultUnit: '根' },
  { id: 'luncheon', name: '午餐肉', category: '蛋白', per100g: { kcal: 260, protein: 12, carbs: 10, fat: 22 }, units: [{ name: 'g', grams: 1 }, { name: '片', grams: 20 }], defaultUnit: '片' },
  { id: 'milk', name: '牛奶', category: '蛋白', per100g: { kcal: 54, protein: 3.4, carbs: 5, fat: 3.2 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 250 }], defaultUnit: '杯' },
  { id: 'yogurt', name: '酸奶', category: '蛋白', per100g: { kcal: 72, protein: 3.2, carbs: 9, fat: 2.7 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 200 }], defaultUnit: '杯' },
  { id: 'cheese', name: '奶酪', category: '蛋白', per100g: { kcal: 402, protein: 25, carbs: 3, fat: 33 }, units: [{ name: 'g', grams: 1 }, { name: '片', grams: 20 }], defaultUnit: '片' },
  { id: 'butter', name: '黄油', category: '蛋白', per100g: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 10 }], defaultUnit: '勺' },
  { id: 'whey', name: '蛋白粉', category: '蛋白', per100g: { kcal: 370, protein: 80, carbs: 8, fat: 4 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 30 }], defaultUnit: '勺' },

  // ===== 海鲜 =====
  { id: 'salmon', name: '三文鱼', category: '海鲜', per100g: { kcal: 208, protein: 20, carbs: 0, fat: 13 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'shrimp', name: '虾', category: '海鲜', per100g: { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'tuna', name: '金枪鱼', category: '海鲜', per100g: { kcal: 132, protein: 28, carbs: 0, fat: 1 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'cod', name: '鳕鱼', category: '海鲜', per100g: { kcal: 88, protein: 20, carbs: 0, fat: 0.7 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'hairtail', name: '带鱼', category: '海鲜', per100g: { kcal: 127, protein: 18, carbs: 3, fat: 5 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'crab', name: '螃蟹', category: '海鲜', per100g: { kcal: 95, protein: 17, carbs: 0, fat: 2 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'oyster', name: '生蚝', category: '海鲜', per100g: { kcal: 81, protein: 9, carbs: 5, fat: 2 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'squid', name: '鱿鱼', category: '海鲜', per100g: { kcal: 92, protein: 15, carbs: 3, fat: 1.4 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },

  // ===== 豆制品 =====
  { id: 'tofu', name: '豆腐', category: '豆制品', per100g: { kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'soymilk', name: '豆浆', category: '豆制品', per100g: { kcal: 31, protein: 3, carbs: 1.2, fat: 1.8 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 250 }], defaultUnit: '杯' },
  { id: 'tempeh', name: '豆干', category: '豆制品', per100g: { kcal: 153, protein: 16, carbs: 4, fat: 8 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 50 }], defaultUnit: '块' },
  { id: 'edamame', name: '毛豆', category: '豆制品', per100g: { kcal: 131, protein: 13, carbs: 11, fat: 5 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },

  // ===== 蔬菜 =====
  { id: 'broccoli', name: '西兰花', category: '蔬菜', per100g: { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'tomato', name: '西红柿', category: '蔬菜', per100g: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 150 }], defaultUnit: '个' },
  { id: 'cucumber', name: '黄瓜', category: '蔬菜', per100g: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '根', grams: 200 }], defaultUnit: '根' },
  { id: 'spinach', name: '菠菜', category: '蔬菜', per100g: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'carrot', name: '胡萝卜', category: '蔬菜', per100g: { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '根', grams: 100 }], defaultUnit: '根' },
  { id: 'pumpkin', name: '南瓜', category: '蔬菜', per100g: { kcal: 26, protein: 1, carbs: 7, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'eggplant', name: '茄子', category: '蔬菜', per100g: { kcal: 25, protein: 1, carbs: 6, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 200 }], defaultUnit: '个' },
  { id: 'pepper', name: '青椒', category: '蔬菜', per100g: { kcal: 20, protein: 1, carbs: 5, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 100 }], defaultUnit: '个' },
  { id: 'lettuce', name: '生菜', category: '蔬菜', per100g: { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'mushroom', name: '蘑菇', category: '蔬菜', per100g: { kcal: 22, protein: 3, carbs: 3, fat: 0.3 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'onion', name: '洋葱', category: '蔬菜', per100g: { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 100 }], defaultUnit: '个' },
  { id: 'asparagus', name: '芦笋', category: '蔬菜', per100g: { kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },

  // ===== 水果 =====
  { id: 'apple', name: '苹果', category: '水果', per100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 180 }], defaultUnit: '个' },
  { id: 'banana', name: '香蕉', category: '水果', per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 120 }], defaultUnit: '个' },
  { id: 'orange', name: '橙子', category: '水果', per100g: { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 130 }], defaultUnit: '个' },
  { id: 'grape', name: '葡萄', category: '水果', per100g: { kcal: 69, protein: 0.7, carbs: 18, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '串', grams: 150 }], defaultUnit: '串' },
  { id: 'watermelon', name: '西瓜', category: '水果', per100g: { kcal: 30, protein: 0.6, carbs: 8, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 200 }], defaultUnit: '块' },
  { id: 'avocado', name: '牛油果', category: '水果', per100g: { kcal: 160, protein: 2, carbs: 9, fat: 15 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 150 }], defaultUnit: '个' },
  { id: 'strawberry', name: '草莓', category: '水果', per100g: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'blueberry', name: '蓝莓', category: '水果', per100g: { kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'kiwi', name: '猕猴桃', category: '水果', per100g: { kcal: 61, protein: 1.1, carbs: 15, fat: 0.5 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 100 }], defaultUnit: '个' },
  { id: 'pear', name: '梨', category: '水果', per100g: { kcal: 57, protein: 0.4, carbs: 15, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 180 }], defaultUnit: '个' },
  { id: 'peach', name: '桃子', category: '水果', per100g: { kcal: 39, protein: 0.9, carbs: 10, fat: 0.3 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 150 }], defaultUnit: '个' },
  { id: 'mango', name: '芒果', category: '水果', per100g: { kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 200 }], defaultUnit: '个' },
  { id: 'pineapple', name: '菠萝', category: '水果', per100g: { kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 150 }], defaultUnit: '块' },
  { id: 'cherry', name: '樱桃', category: '水果', per100g: { kcal: 63, protein: 1, carbs: 16, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '串', grams: 150 }], defaultUnit: '串' },

  // ===== 坚果 / 零食 / 甜点 =====
  { id: 'oil', name: '食用油', category: '油脂', per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 10 }], defaultUnit: '勺' },
  { id: 'peanut', name: '花生', category: '坚果', per100g: { kcal: 567, protein: 26, carbs: 16, fat: 49 }, units: [{ name: 'g', grams: 1 }, { name: '把', grams: 30 }], defaultUnit: '把' },
  { id: 'walnut', name: '核桃', category: '坚果', per100g: { kcal: 654, protein: 15, carbs: 14, fat: 65 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 10 }], defaultUnit: '个' },
  { id: 'almond', name: '杏仁', category: '坚果', per100g: { kcal: 579, protein: 21, carbs: 22, fat: 50 }, units: [{ name: 'g', grams: 1 }, { name: '把', grams: 30 }], defaultUnit: '把' },
  { id: 'cashew', name: '腰果', category: '坚果', per100g: { kcal: 553, protein: 18, carbs: 30, fat: 44 }, units: [{ name: 'g', grams: 1 }, { name: '把', grams: 30 }], defaultUnit: '把' },
  { id: 'pistachio', name: '开心果', category: '坚果', per100g: { kcal: 562, protein: 20, carbs: 27, fat: 45 }, units: [{ name: 'g', grams: 1 }, { name: '把', grams: 30 }], defaultUnit: '把' },
  { id: 'chocolate', name: '巧克力', category: '零食', per100g: { kcal: 546, protein: 4.9, carbs: 61, fat: 31 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 10 }], defaultUnit: '块' },
  { id: 'biscuit', name: '饼干', category: '零食', per100g: { kcal: 433, protein: 6, carbs: 64, fat: 16 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 15 }], defaultUnit: '块' },
  { id: 'cake', name: '蛋糕', category: '零食', per100g: { kcal: 350, protein: 5, carbs: 55, fat: 12 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 80 }], defaultUnit: '块' },
  { id: 'icecream', name: '冰淇淋', category: '零食', per100g: { kcal: 207, protein: 3.5, carbs: 24, fat: 11 }, units: [{ name: 'g', grams: 1 }, { name: '球', grams: 50 }], defaultUnit: '球' },
  { id: 'chips', name: '薯片', category: '零食', per100g: { kcal: 536, protein: 7, carbs: 53, fat: 35 }, units: [{ name: 'g', grams: 1 }, { name: '袋', grams: 40 }], defaultUnit: '袋' },

  // ===== 饮品 =====
  { id: 'cola', name: '可乐', category: '饮品', per100g: { kcal: 43, protein: 0, carbs: 10.6, fat: 0 }, units: [{ name: 'g', grams: 1 }, { name: '罐', grams: 330 }], defaultUnit: '罐' },
  { id: 'coffee', name: '黑咖啡', category: '饮品', per100g: { kcal: 2, protein: 0.3, carbs: 0, fat: 0 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 240 }], defaultUnit: '杯' },
  { id: 'beer', name: '啤酒', category: '饮品', per100g: { kcal: 43, protein: 0.5, carbs: 3.6, fat: 0 }, units: [{ name: 'g', grams: 1 }, { name: '瓶', grams: 500 }], defaultUnit: '瓶' },
  { id: 'orangejuice', name: '橙汁', category: '饮品', per100g: { kcal: 45, protein: 0.7, carbs: 10, fat: 0.2 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 250 }], defaultUnit: '杯' },
  { id: 'milktea', name: '奶茶', category: '饮品', per100g: { kcal: 70, protein: 1, carbs: 10, fat: 2.5 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 300 }], defaultUnit: '杯' },
  { id: 'redwine', name: '红酒', category: '饮品', per100g: { kcal: 85, protein: 0.1, carbs: 2.6, fat: 0 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 150 }], defaultUnit: '杯' },
  { id: 'latte', name: '拿铁', category: '饮品', per100g: { kcal: 50, protein: 3, carbs: 5, fat: 1.8 }, units: [{ name: 'g', grams: 1 }, { name: '杯', grams: 300 }], defaultUnit: '杯' },
  { id: 'sportsdrink', name: '运动饮料', category: '饮品', per100g: { kcal: 28, protein: 0, carbs: 7, fat: 0 }, units: [{ name: 'g', grams: 1 }, { name: '瓶', grams: 500 }], defaultUnit: '瓶' },

  // ===== 快餐 / 外卖 =====
  { id: 'hamburger', name: '汉堡', category: '快餐', per100g: { kcal: 295, protein: 17, carbs: 24, fat: 14 }, units: [{ name: 'g', grams: 1 }, { name: '个', grams: 150 }], defaultUnit: '个' },
  { id: 'pizza', name: '披萨', category: '快餐', per100g: { kcal: 266, protein: 11, carbs: 33, fat: 10 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 100 }], defaultUnit: '块' },
  { id: 'friedchicken', name: '炸鸡', category: '快餐', per100g: { kcal: 320, protein: 18, carbs: 15, fat: 22 }, units: [{ name: 'g', grams: 1 }, { name: '块', grams: 80 }], defaultUnit: '块' },
  { id: 'fries', name: '薯条', category: '快餐', per100g: { kcal: 312, protein: 4, carbs: 41, fat: 15 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 100 }], defaultUnit: '份' },
  { id: 'instantnoodle', name: '方便面', category: '快餐', per100g: { kcal: 472, protein: 9, carbs: 66, fat: 22 }, units: [{ name: 'g', grams: 1 }, { name: '桶', grams: 100 }], defaultUnit: '桶' },
  { id: 'friedrice', name: '炒饭', category: '快餐', per100g: { kcal: 180, protein: 5, carbs: 30, fat: 4 }, units: [{ name: 'g', grams: 1 }, { name: '份', grams: 200 }], defaultUnit: '份' },

  // ===== 调味 =====
  { id: 'ketchup', name: '番茄酱', category: '调味', per100g: { kcal: 112, protein: 1.2, carbs: 27, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 15 }], defaultUnit: '勺' },
  { id: 'salad', name: '沙拉酱', category: '调味', per100g: { kcal: 460, protein: 1, carbs: 7, fat: 48 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 15 }], defaultUnit: '勺' },
  { id: 'soysauce', name: '酱油', category: '调味', per100g: { kcal: 53, protein: 8, carbs: 4.5, fat: 0.1 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 15 }], defaultUnit: '勺' },
  { id: 'sugar', name: '白糖', category: '调味', per100g: { kcal: 400, protein: 0, carbs: 100, fat: 0 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 10 }], defaultUnit: '勺' },
  { id: 'honey', name: '蜂蜜', category: '调味', per100g: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 }, units: [{ name: 'g', grams: 1 }, { name: '勺', grams: 20 }], defaultUnit: '勺' },
]

/** 按 id 查找默认食物（仅供参考，实际数据以 store 中的 foods 为准） */
export function getFoodById(id: string): FoodItem | undefined {
  return DEFAULT_FOODS.find((f) => f.id === id)
}

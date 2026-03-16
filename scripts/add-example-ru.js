/* Скрипт постобработки BASIC_WORDS:
 * добавляет поле exampleRu по заранее заданной карте
 * и перезаписывает api/basicWordsData.generated.js.
 *
 * Запускать из корня проекта:
 *   node scripts/add-example-ru.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASIC_WORDS } from '../api/basicWordsData.generated.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Картa: английское предложение -> русский перевод */
const EXAMPLE_RU_MAP = {
  // Семья
  'My father is tall.': 'Мой отец высокий.',
  'My mother is kind.': 'Моя мама добрая.',
  'I have a brother.': 'У меня есть брат.',
  'My sister is funny.': 'Моя сестра смешная.',
  'My parents are at home.': 'Мои родители дома.',
  'He is my son.': 'Он мой сын.',
  'She is my daughter.': 'Она моя дочь.',
  'My family is big.': 'Моя семья большая.',
  'The baby is sleeping.': 'Малыш спит.',
  'My husband is a doctor.': 'Мой муж — врач.',
  'His wife is beautiful.': 'Его жена красивая.',
  'My uncle lives in London.': 'Мой дядя живет в Лондоне.',
  'My aunt likes to cook.': 'Моя тетя любит готовить.',
  'My cousin is my friend.': 'Мой двоюродный брат — мой друг.',
  'My grandfather is old.': 'Мой дедушка старый.',
  'My grandmother is nice.': 'Моя бабушка милая.',

  // Профессии
  'My brother is a doctor.': 'Мой брат — врач.',
  'She is a good teacher.': 'Она хорошая учительница.',
  'The nurse is kind.': 'Медсестра добрая.',
  'He is an engineer.': 'Он инженер.',
  'My father is a driver.': 'Мой отец — водитель.',
  'The cook makes good food.': 'Повар готовит вкусную еду.',
  'My uncle is a farmer.': 'Мой дядя — фермер.',
  'The policeman is helpful.': 'Полицейский помогает.',
  'The firefighter is brave.': 'Пожарный храбрый.',
  'I am a student.': 'Я студент.',
  'She is an artist.': 'Она художница.',
  'My aunt is a lawyer.': 'Моя тетя — юрист.',
  'The dentist is busy.': 'Стоматолог занят.',
  'The pilot flies a plane.': 'Пилот управляет самолетом.',
  'The waiter brings food.': 'Официант приносит еду.',
  'She is a famous singer.': 'Она известная певица.',

  // Город
  'I live in a big city.': 'Я живу в большом городе.',
  'The street is busy.': 'Улица оживленная.',
  'The park is beautiful.': 'Парк красивый.',
  'The shop is open.': 'Магазин открыт.',
  'The school is near my house.': 'Школа рядом с моим домом.',
  'The hospital is new.': 'Больница новая.',
  'The restaurant is popular.': 'Ресторан популярный.',
  'The bank is closed.': 'Банк закрыт.',
  'The bus is red.': 'Автобус красный.',
  'The train is fast.': 'Поезд быстрый.',
  'The station is crowded.': 'Станция переполнена.',
  'The airport is far.': 'Аэропорт далеко.',
  'The library is quiet.': 'В библиотеке тихо.',
  'The museum is interesting.': 'Музей интересный.',
  'The hotel is expensive.': 'Отель дорогой.',
  'The market is busy.': 'На рынке оживленно.',

  // Эмоции
  'I am happy today.': 'Я счастлив сегодня.',
  'She feels sad.': 'Ей грустно.',
  'He is angry with me.': 'Он зол на меня.',
  'The child is scared.': 'Ребенок напуган.',
  'I am excited about the trip.': 'Я в предвкушении поездки.',
  'He is bored at home.': 'Ему скучно дома.',
  'She is tired after work.': 'Она устала после работы.',
  'I am nervous before the exam.': 'Я нервничаю перед экзаменом.',
  'He is surprised by the news.': 'Он удивлен новостями.',
  'She is calm and relaxed.': 'Она спокойна и расслаблена.',
  'He looks confused.': 'Он выглядит растерянным.',
  'I am proud of my son.': 'Я горжусь своим сыном.',
  'She feels lonely sometimes.': 'Иногда она чувствует себя одинокой.',
  'He is jealous of his brother.': 'Он завидует своему брату.',
  'I feel relaxed at the beach.': 'Я чувствую расслабление на пляже.',

  // Страны
  'Russia is a big country.': 'Россия — большая страна.',
  'I live in Russia.': 'Я живу в России.',
  'The USA is far away.': 'США далеко.',
  'England is rainy.': 'В Англии дождливо.',
  'Paris is in France.': 'Париж во Франции.',
  'Germany has many cities.': 'В Германии много городов.',
  'Italy is famous for pasta.': 'Италия славится пастой.',
  'Japan is an island country.': 'Япония — островное государство.',
  'China is very large.': 'Китай очень большой.',
  'Spain is warm.': 'В Испании тепло.',
  'Canada is cold in winter.': 'В Канаде холодно зимой.',
  'Brazil is in South America.': 'Бразилия находится в Южной Америке.',
  'India is very colorful.': 'Индия очень красочная.',
  'Australia has kangaroos.': 'В Австралии есть кенгуру.',
  'Egypt has pyramids.': 'В Египте есть пирамиды.',
  'Mexico is famous for tacos.': 'Мексика славится тако.',

  // Еда и напитки
  'I eat bread for breakfast.': 'Я ем хлеб на завтрак.',
  'I drink water every day.': 'Я пью воду каждый день.',
  'She likes milk in her coffee.': 'Она любит молоко в кофе.',
  'Orange juice is refreshing.': 'Апельсиновый сок освежает.',
  'I have coffee in the morning.': 'Я пью кофе утром.',
  'He drinks tea in the evening.': 'Он пьет чай вечером.',
  'Rice is a common food.': 'Рис — распространенная еда.',
  'Meat is delicious.': 'Мясо вкусное.',
  'I like grilled fish.': 'Я люблю рыбу на гриле.',
  'Fruit is healthy.': 'Фрукты полезны.',
  'Vegetables are good for you.': 'Овощи полезны для вас.',
  'Cheese is on my sandwich.': 'В моем сэндвиче есть сыр.',
  'Chicken is my favorite food.': 'Курица — моя любимая еда.',
  'Pasta is easy to cook.': 'Пасту легко готовить.',
  'I had soup for lunch.': 'Я ел суп на обед.',
  'Salad is fresh and tasty.': 'Салат свежий и вкусный.',
  'She baked a chocolate cake.': 'Она испекла шоколадный торт.',
  'I made a sandwich for lunch.': 'Я приготовил сэндвич на обед.',
  'Ice cream is a sweet treat.': 'Мороженое — сладкое лакомство.',

  // Самые важные глаголы. Часть 1
  'I am a student.': 'Я студент.',
  'She has a cat.': 'У нее есть кошка.',
  'I do my homework.': 'Я делаю свою домашнюю работу.',
  'He says hello.': 'Он говорит "привет".',
  'We go to the park.': 'Мы идем в парк.',
  'She gets a letter.': 'Она получает письмо.',
  'I make dinner.': 'Я готовлю ужин.',
  'They know the answer.': 'Они знают ответ.',
  'He takes the bus.': 'Он едет на автобусе.',
  'I see a bird.': 'Я вижу птицу.',
  "She comes home at 5 o'clock.": 'Она приходит домой в 5 часов.',
  "I think it's a good idea.": 'Я думаю, это хорошая идея.',
  'They want to play.': 'Они хотят играть.',
  'I like chocolate.': 'Мне нравится шоколад.',
  'He works in an office.': 'Он работает в офисе.',
  'We talk about the movie.': 'Мы говорим о фильме.',
  'She uses a computer.': 'Она использует компьютер.',
  'The children play outside.': 'Дети играют на улице.',
  'Can you help me?': 'Ты можешь мне помочь?',

  // Самые важные глаголы. Часть 2
  'I find my keys.': 'Я нахожу свои ключи.',
  'She starts work at 9 a.m.': 'Она начинает работу в 9 утра.',
  'We finish dinner at 7 p.m.': 'Мы заканчиваем ужин в 7 вечера.',
  'I love reading books.': 'Я люблю читать книги.',
  'He hates doing the dishes.': 'Он ненавидит мыть посуду.',
  'Can I ask you a question?': 'Могу я задать тебе вопрос?',
  'She answers the phone.': 'Она отвечает на телефонный звонок.',
  'They buy groceries.': 'Они покупают продукты.',
  'He sells fruits at the market.': 'Он продает фрукты на рынке.',
  'She shows me her new dress.': 'Она показывает мне свое новое платье.',
  'I listen to music every day.': 'Я слушаю музыку каждый день.',
  'He reads a book.': 'Он читает книгу.',
  'She writes a letter.': 'Она пишет письмо.',
  'He drives to work.': 'Он едет на работу на машине.',
  'We travel to different countries.': 'Мы путешествуем по разным странам.',
  'She sings in the choir.': 'Она поет в хоре.',
  'They dance at the party.': 'Они танцуют на вечеринке.',
  'I study English every day.': 'Я учу английский каждый день.',
  'I remember his name.': 'Я помню его имя.',

  // Самые важные глаголы. Часть 3
  'The lesson begins at 9 a.m.': 'Урок начинается в 9 утра.',
  'The movie ends at 10 p.m.': 'Фильм заканчивается в 10 вечера.',
  'I call my friend every day.': 'Я звоню своему другу каждый день.',
  'She speaks English very well.': 'Она очень хорошо говорит по-английски.',
  'I understand the instructions.': 'Я понимаю инструкции.',
  'They build a sandcastle.': 'Они строят замок из песка.',
  'He breaks the glass by accident.': 'Он случайно разбивает стакан.',
  'She cleans the house on weekends.': 'Она убирает дом по выходным.',
  'I cook dinner for my family.': 'Я готовлю ужин для своей семьи.',
  'He draws pictures in his notebook.': 'Он рисует картинки в своем блокноте.',
  'I find this book interesting.': 'Я нахожу эту книгу интересной.',
  "Don't forget your keys.": 'Не забывай свои ключи.',
  'She gives me a gift.': 'Она дарит мне подарок.',
  'We join the club together.': 'Мы вместе вступаем в клуб.',
  'They leave the office at 6 p.m.': 'Они уходят из офиса в 6 вечера.',
  'I pay for the tickets.': 'Я плачу за билеты.',
  'She puts the book on the shelf.': 'Она кладет книгу на полку.',
  'He reads the newspaper daily.': 'Он читает газету ежедневно.',
  'I remember the address.': 'Я помню адрес.',
  'Can you show me the way?': 'Не могли бы вы показать мне дорогу?',
  'We stay at a hotel.': 'Мы останавливаемся в отеле.',
  'She teaches math at school.': 'Она преподает математику в школе.',
  'Turn left at the corner.': 'Поверните налево за углом.',
  'They use a map to find the place.': 'Они используют карту, чтобы найти место.',

  // Погода
  'The weather is nice today.': 'Сегодня хорошая погода.',
  'The sun is shining brightly.': 'Солнце светит ярко.',
  'It is raining now.': 'Сейчас идет дождь.',
  'The ground is covered with snow.': 'Земля покрыта снегом.',
  'The wind is strong today.': 'Сегодня сильный ветер.',
  'The sky is full of clouds.': 'Небо полно облаков.',
  'It is very hot outside.': 'На улице очень жарко.',
  'It is cold in the winter.': 'Зимой холодно.',
  'The weather is warm in spring.': 'Весной погода теплая.',
  'It is cool in the evening.': 'Вечером прохладно.',
  'The fog is thick this morning.': 'Сегодня утром густой туман.',
  'A storm is coming.': 'Приближается шторм.',
  'I hear thunder in the distance.': 'Я слышу гром вдалеке.',
  'There was lightning last night.': 'Прошлой ночью была молния.',
  'It feels very humid today.': 'Сегодня очень влажно.',

  // Путешествия
  'I love to travel to new places.': 'Я люблю путешествовать в новые места.',
  'We have a trip to Paris next week.': 'На следующей неделе у нас поездка в Париж.',
  'The airport is very busy.': 'Аэропорт очень оживленный.',
  'Our flight is delayed.': 'Наш рейс задерживается.',
  'I need a ticket for the train.': 'Мне нужен билет на поезд.',
  'We are staying at a hotel.': 'Мы останавливаемся в отеле.',
  'I made a reservation for dinner.': 'Я забронировал столик на ужин.',
  'My luggage is heavy.': 'Мой багаж тяжелый.',
  'Can you show me on the map?': 'Вы можете показать мне на карте?',
  "Don't forget your passport.": 'Не забудьте свой паспорт.',
  'I need a visa to enter the country.': 'Мне нужна виза для въезда в страну.',
  'The guide shows us the city.': 'Гид показывает нам город.',
  'We took a tour of the museum.': 'Мы посетили экскурсию по музею.',
  'We did some sightseeing yesterday.': 'Вчера мы осматривали достопримечательности.',
  'The beach is sandy and warm.': 'Пляж песчаный, и вода теплая.',
  'We climbed a high mountain.': 'Мы взобрались на высокую гору.',
  'We went on a cruise last summer.': 'Прошлым летом мы отправились в круиз.',
  'The trip was an adventure.': 'Поездка была приключением.',
  'I enjoy learning about new cultures.': 'Мне нравится узнавать о новых культурах.',

  // Дни недели и месяцы
  'Monday is the first day of the week.': 'Понедельник — первый день недели.',
  'I have a meeting on Tuesday.': 'У меня встреча во вторник.',
  'Wednesday is in the middle of the week.': 'Среда — середина недели.',
  'My birthday is on Thursday.': 'Мой день рождения в четверг.',
  'We go out on Friday nights.': 'Мы ходим гулять вечером в пятницу.',
  'Saturday is a day off for many people.': 'Суббота — выходной день для многих людей.',
  'Sunday is a day for relaxing.': 'Воскресенье — день для отдыха.',
  'January is the first month of the year.': 'Январь — первый месяц года.',
  'My birthday is in February.': 'Мой день рождения в феврале.',
  'Spring begins in March.': 'Весна начинается в марте.',
  'April showers bring May flowers.': 'Апрельские дожди приносят майские цветы.',
  'May is warm and sunny.': 'В мае тепло и солнечно.',
  'June is the start of summer.': 'Июнь — начало лета.',
  'We go on vacation in July.': 'Мы едем в отпуск в июле.',
  'August is hot in many places.': 'Во многих местах август жаркий.',
  'School starts in September.': 'Школа начинается в сентябре.',
  'October is known for Halloween.': 'Октябрь известен Хэллоуином.',
  'November is cool and windy.': 'В ноябре прохладно и ветрено.',
  'December is the last month of the year.': 'Декабрь — последний месяц года.',

  // Животные
  'The dog is playing in the yard.': 'Собака играет во дворе.',
  'My cat is very friendly.': 'Мой кот очень дружелюбный.',
  'The bird is singing in the tree.': 'Птица поет на дереве.',
  'I have a fish in my aquarium.': 'У меня есть рыбка в аквариуме.',
  'The rabbit is eating a carrot.': 'Кролик ест морковку.',
  'The horse is running in the field.': 'Лошадь бежит по полю.',
  'The elephant is big and gray.': 'Слон большой и серый.',
  'The lion is the king of the jungle.': 'Лев — король джунглей.',
  'Tigers are very strong animals.': 'Тигры — очень сильные животные.',
  'The bear is hibernating in winter.': 'Медведь впадает в спячку зимой.',
  'Monkeys live in the jungle.': 'Обезьяны живут в джунглях.',
  'The giraffe has a long neck.': 'У жирафа длинная шея.',
  'The zebra has black and white stripes.': 'У зебры черно-белые полосы.',
  'The deer is grazing in the forest.': 'Олень пасется в лесу.',
  'Kangaroos jump high.': 'Кенгуру высоко прыгают.',
  'Dolphins are very intelligent.': 'Дельфины очень умные.',
  'Penguins live in cold climates.': 'Пингвины живут в холодном климате.',
  'The owl is a night bird.': 'Сова — ночная птица.',
  'The snake is slithering through the grass.': 'Змея ползет по траве.',

  // Магазин
  'I am going to the store.': 'Я иду в магазин.',
  'This shop sells clothes.': 'Этот магазин продает одежду.',
  'The mall is very big.': 'Торговый центр очень большой.',
  'The cashier is friendly.': 'Кассир дружелюбный.',
  'I need to go to the checkout.': 'Мне нужно подойти к кассе.',
  'I received a receipt for my purchase.': 'Я получил чек за свою покупку.',
  'The price of the book is $10.': 'Цена книги 10 долларов.',
  'There is a discount on shoes.': 'На обувь скидка.',
  'The sale is this weekend.': 'Распродажа в эти выходные.',
  'I want to buy this item.': 'Я хочу купить этот товар.',
  'Can I have a bag for my purchases?': 'Можно мне пакет для покупок?',
  'The books are on the shelf.': 'Книги на полке.',
  'This product is new.': 'Этот продукт новый.',
  'What size is this jacket?': 'Какого размера эта куртка?',
  'We need to check the stock.': 'Нам нужно проверить наличие.',
  'The customer is asking for help.': 'Покупатель просит о помощи.',
  'I made a purchase yesterday.': 'Я совершил покупку вчера.',
  'I want to return this item.': 'Я хочу вернуть этот товар.',
  'The checkout counter is near the exit.': 'Касса находится у выхода.',

  // Дом
  'I live in a big house.': 'Я живу в большом доме.',
  'I feel comfortable at home.': 'Я чувствую себя комфортно дома.',
  'This is my bedroom.': 'Это моя спальня.',
  'We cook dinner in the kitchen.': 'Мы готовим ужин на кухне.',
  'The bathroom is next to my room.': 'Ванная рядом с моей комнатой.',
  'We watch TV in the living room.': 'Мы смотрим телевизор в гостиной.',
  'I sleep in the bedroom.': 'Я сплю в спальне.',
  'The car is in the garage.': 'Машина в гараже.',
  'The garden has many flowers.': 'В саду много цветов.',
  'The floor is made of wood.': 'Пол сделан из дерева.',
  'Close the door, please.': 'Закрой дверь, пожалуйста.',
  'The window is open.': 'Окно открыто.',
  'The roof is red.': 'Крыша красная.',
  'The wall is painted white.': 'Стена покрашена в белый цвет.',
  'The staircase is wooden.': 'Лестница деревянная.',
  'The furniture is very modern.': 'Мебель очень современная.',
  'The table is in the center of the room.': 'Стол в центре комнаты.',
  'I sit on a chair at my desk.': 'Я сижу на стуле за своим столом.',
  'I have a comfortable bed.': 'У меня удобная кровать.',

  // Больница
  'I am going to the hospital.': 'Я иду в больницу.',
  'The doctor is very kind.': 'Врач очень добрый.',
  'The nurse is checking my blood pressure.': 'Медсестра проверяет мое давление.',
  'The patient is waiting for the doctor.': 'Пациент ждет врача.',
  'I have an appointment at 3 p.m.': 'У меня запись на 3 часа дня.',
  'Call emergency if there is a serious problem.': 'Звоните в скорую, если есть серьезная проблема.',
  'I need to take this medicine twice a day.': 'Мне нужно принимать это лекарство два раза в день.',
  'He needs surgery for his knee.': 'Ему нужна операция на колене.',
  'The doctor gave me a prescription.': 'Врач выписал мне рецепт.',
  'The patient is in the recovery ward.': 'Пациент находится в палате выздоравливающих.',
  'The hospital bed is very comfortable.': 'Больничная кровать очень удобная.',
  'They took an X-ray of my arm.': 'Они сделали рентген моей руки.',
  'The clinic is open from 9 a.m. to 6 p.m.': 'Клиника открыта с 9 утра до 6 вечера.',
  'The waiting room is very crowded.': 'В зале ожидания очень многолюдно.',
  'I need a check-up for my health.': 'Мне нужен осмотр для моего здоровья.',
  'The ambulance arrived quickly.': 'Скорая помощь приехала быстро.',
  'The nurse put a bandage on my cut.': 'Медсестра наложила повязку на мой порез.',
};

function addExampleRu(words) {
  return words.map((w) => {
    if (!w.example) return w;
    const ru = EXAMPLE_RU_MAP[w.example];
    if (!ru) return w;
    return { ...w, exampleRu: ru };
  });
}

const updated = addExampleRu(BASIC_WORDS);

const outPath = path.resolve(__dirname, '../api/basicWordsData.generated.js');

const header = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n` +
  `// Run: node scripts/generate-basic-words.js\n\n` +
  `export const BASIC_WORDS = `;

const json = JSON.stringify(updated, null, 2);
const content = `${header}${json};\n`;

fs.writeFileSync(outPath, content, 'utf8');

console.log('basicWordsData.generated.js updated with exampleRu (where available).');


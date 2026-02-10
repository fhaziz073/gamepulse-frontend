import { BalldontlieAPI } from "@balldontlie/sdk";
import React, { useEffect, useState } from "react";
import {
  // Calendar,
  CalendarProvider,
  CalendarUtils,
  ExpandableCalendar,
  Timeline,
} from "react-native-calendars";
import { Positions } from "react-native-calendars/src/expandableCalendar";
import { Event } from "react-native-calendars/src/timeline/EventBlock";

const api = new BalldontlieAPI({
  apiKey: "insert_api_key",
});
const getGames = async (
  day: string,
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
) => {
  let dates = [day];
  console.log(dates);
  try {
    let games = await api.nba.getGames({ team_ids: [1], dates });
    console.log(JSON.stringify(games));
    let event: Event[] = [
      {
        start: `${day} 09:20:00`,
        end: `${day} 12:00:00`,
        title: "Game 1",
      },
    ];
    console.log(event);
    setEvents(event);
  } catch (e) {
    console.log(e);
  }
};
const today = new Date();
export const getDate: (offset: number) => string = (offset = 0) =>
  CalendarUtils.getCalendarDateString(
    new Date().setDate(today.getDate() + offset),
  );

const App = () => {
  const [selected, setSelected] = useState("");
  const [timelineOn, setTimelineOn] = useState(false);
  const [events2, setEvents2] = useState<Event[]>([]);
  useEffect(() => {
    console.log(events2);
  }, [events2]);
  return (
    <CalendarProvider date={getDate(0)}>
      <ExpandableCalendar
        onDayPress={async (day) => {
          setSelected(day.dateString);
          console.log(day.dateString);
          await getGames(day.dateString, setEvents2);
        }}
        markedDates={{
          [selected]: {
            selected: true,
            disableTouchEvent: true,
            selectedColor: "orange",
          },
        }}
        onCalendarToggled={() => setTimelineOn(!timelineOn)}
        initialPosition={Positions.OPEN}
      />
      {timelineOn ? <Timeline events={events2} /> : <></>}
    </CalendarProvider>
  );
};

export default App;

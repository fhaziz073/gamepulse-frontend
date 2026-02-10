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

const getGames = async (
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
) => {
  let response = await fetch("http://localhost:3000/calendar");
  console.log(response);
  let events = await response.json();
  setEvents(events);
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
          await getGames(setEvents2);
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

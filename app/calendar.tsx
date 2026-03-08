import filter from "lodash/filter";
import find from "lodash/find";
import groupBy from "lodash/groupBy";
import React, { Component, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  // Calendar,
  CalendarProvider,
  CalendarUtils,
  ExpandableCalendar,
  TimelineEventProps,
  TimelineList,
  TimelineProps,
} from "react-native-calendars";

type event = {
  start: string;
  end: string;
  title: string;
};
const today = new Date();
export const getDate: (offset: number) => string = (offset = 0) =>
  CalendarUtils.getCalendarDateString(
    new Date().setDate(today.getDate() + offset),
  );
interface Props {
  newEvents: event[];
}
const INITIAL_TIME = { hour: 9, minutes: 0 };
class TimelineCalendarScreen extends Component<Props, {}> {
  state = {
    currentDate: getDate(0),
    events: this.props.newEvents,
    eventsByDate: groupBy(this.props.newEvents, (e) =>
      CalendarUtils.getCalendarDateString(e.start),
    ) as {
      [key: string]: TimelineEventProps[];
    },
  };

  marked = {
    [`${getDate(0)}`]: { marked: false },
  };
  componentDidUpdate(prevProps: Props) {
    if (prevProps.newEvents !== this.props.newEvents) {
      this.setState({
        events: this.props.newEvents,
        eventsByDate: groupBy(this.props.newEvents, (e) =>
          CalendarUtils.getCalendarDateString(e.start),
        ),
      });
      for (let event of this.props.newEvents) {
        this.marked[event.start.slice(0, 10)] = { marked: true };
      }
    }
  }
  onDateChanged = (date: string, source: string) => {
    console.log("TimelineCalendarScreen onDateChanged: ", date, source);
    this.setState({ currentDate: date });
  };

  onMonthChange = (month: any, updateSource: any) => {
    console.log("TimelineCalendarScreen onMonthChange: ", month, updateSource);
  };

  createNewEvent: TimelineProps["onBackgroundLongPress"] = (
    timeString,
    timeObject,
  ) => {
    const { eventsByDate } = this.state;
    const hourString = `${(timeObject.hour + 1).toString().padStart(2, "0")}`;
    const minutesString = `${timeObject.minutes.toString().padStart(2, "0")}`;

    const newEvent = {
      id: "draft",
      start: `${timeString}`,
      end: `${timeObject.date} ${hourString}:${minutesString}:00`,
      title: "New Event",
      color: "white",
    };

    if (timeObject.date) {
      if (eventsByDate[timeObject.date]) {
        eventsByDate[timeObject.date] = [
          ...eventsByDate[timeObject.date],
          newEvent,
        ];
        this.setState({ eventsByDate });
      } else {
        eventsByDate[timeObject.date] = [newEvent];
        this.setState({ eventsByDate: { ...eventsByDate } });
      }
    }
  };

  approveNewEvent: TimelineProps["onBackgroundLongPressOut"] = (
    _timeString,
    timeObject,
  ) => {
    const { eventsByDate } = this.state;

    Alert.prompt("New Event", "Enter event title", [
      {
        text: "Cancel",
        onPress: () => {
          if (timeObject.date) {
            eventsByDate[timeObject.date] = filter(
              eventsByDate[timeObject.date],
              (e) => e.id !== "draft",
            );

            this.setState({
              eventsByDate,
            });
          }
        },
      },
      {
        text: "Create",
        onPress: (eventTitle: string | undefined) => {
          if (timeObject.date) {
            const draftEvent = find(eventsByDate[timeObject.date], {
              id: "draft",
            });
            if (draftEvent) {
              draftEvent.id = undefined;
              draftEvent.title = eventTitle ?? "New Event";
              draftEvent.color = "lightgreen";
              eventsByDate[timeObject.date] = [
                ...eventsByDate[timeObject.date],
              ];

              this.setState({
                eventsByDate,
              });
            }
          }
        },
      },
    ]);
  };

  private timelineProps: Partial<TimelineProps> = {
    format24h: true,
    onBackgroundLongPress: this.createNewEvent,
    onBackgroundLongPressOut: this.approveNewEvent,
    // scrollToFirst: true,
    // start: 0,
    // end: 24,
    unavailableHours: [
      { start: 0, end: 6 },
      { start: 22, end: 24 },
    ],
    overlapEventsSpacing: 8,
    rightEdgeSpacing: 24,
  };

  render() {
    const { currentDate, eventsByDate } = this.state;
    return (
      <CalendarProvider
        date={currentDate}
        onDateChanged={this.onDateChanged}
        onMonthChange={this.onMonthChange}
        showTodayButton
        disabledOpacity={0.6}
        // numberOfDays={3}
      >
        <ExpandableCalendar
          firstDay={1}
          leftArrowImageSource={require("../assets/images/previous.png")}
          rightArrowImageSource={require("../assets/images/next.png")}
          markedDates={this.marked}
        />
        <TimelineList
          events={eventsByDate}
          timelineProps={this.timelineProps}
          showNowIndicator
          // scrollToNow
          scrollToFirst
          initialTime={INITIAL_TIME}
        />
      </CalendarProvider>
    );
  }
}

export default function Index() {
  const [data, setData] = useState<event[]>([]);
  const [broadcasts, setBroadcasts] = useState<any>([]);
  useEffect(() => {
    const getGames = async () => {
      try {
        let response = null;
        if (Platform.OS === "android") {
          response = await fetch("http://10.0.2.2:3000/calendar");
        } else {
          response = await fetch("http://localhost:3000/calendar");
        }
        console.log(response);
        let events = await response.json();
        console.log(events);
        setData(events);
      } catch {
        console.log("Failed to fetch data");
        setData([]);
      }
    };
    getGames();
  }, []);
  useEffect(() => {
    const getBroadcasts = async () => {
      try {
        let response = await fetch(
          "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
        );
        console.log(response);
        let responsejson = await response.json();
        let broadcasts = [];
        console.log(responsejson.events);
        for (let e of responsejson.events) {
          const [left, right] = e.name.split(" at ");
          const team1 = left.trim().split(" ").pop();
          const team2 = right.trim().split(" ").pop();
          const name = `${team1} at ${team2}`;
          const name2 = `${team2} vs ${team1}`;
          const names = [name, name2];
          for (let c of e.competitions) {
            broadcasts.push({ names, broadcasts: c.broadcasts });
          }
        }
        setBroadcasts(broadcasts);
      } catch {
        console.log("Failed to fetch data");
        setBroadcasts([]);
      }
    };
    getBroadcasts();
  }, []);
  console.log(data);
  console.log(broadcasts);
  return <TimelineCalendarScreen newEvents={data} />;
}

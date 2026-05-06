import groupBy from "lodash/groupBy";
import React, { Component, useEffect, useState } from "react";
import { View } from "react-native";
import {
  CalendarProvider,
  CalendarUtils,
  ExpandableCalendar,
  TimelineEventProps,
  TimelineList,
  TimelineProps,
} from "react-native-calendars";
import EStyleSheet from "react-native-extended-stylesheet";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { link } from "./_layout";
import { useAppSelector } from "./hooks";
import { event } from "./types";

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

  private timelineProps: Partial<TimelineProps> = {
    format24h: true,
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
        style={{ flex: 1 }}
      >
        <ExpandableCalendar
          firstDay={1}
          leftArrowImageSource={require("../assets/images/previous.png")}
          rightArrowImageSource={require("../assets/images/next.png")}
          markingType="period"
          markedDates={{
            ...this.marked,
            [currentDate]: {
              marked: this.marked[currentDate]?.marked ?? false,
              customContainerStyle: {
                backgroundColor: "#FF0000B3",
                width: 30,
                height: 30,
              },
            },
          }}
          theme={{
            todayTextColor: "#0F55D7",
            textSectionTitleColor: "#568F74",
            textDayFontFamily: "Verdana",
            textMonthFontFamily: "Verdana",
            textMonthFontWeight: "bold",
          }}
        />
        <View style={styles.timeline}>
          <TimelineList
            events={eventsByDate}
            timelineProps={this.timelineProps}
            showNowIndicator
            scrollToNow
            initialTime={INITIAL_TIME}
          />
        </View>
      </CalendarProvider>
    );
  }
}

export default function Index() {
  const [data, setData] = useState<event[]>([]);
  const [broadcasts, setBroadcasts] = useState<any>([]);
  const notifToken = useAppSelector(
    (state) => state.userInfo?.["Notification Token"],
  );
  useEffect(() => {
    const getGames = async () => {
      try {
        let response = null;
        response = await fetch(`${link}/calendar/6`);
        console.log(response);
        let events: event[] = await response.json();
        console.log(events);
        for (let event of events) {
          const toLocal = (utcStr: string): string => {
            const date = new Date(utcStr.replace(" ", "T") + "Z");
            const pad = (n: number) => n.toString().padStart(2, "0");
            const localDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
            const localTime = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            return `${localDate} ${localTime}`;
          };
          event.start = toLocal(event.start);
          event.end = toLocal(event.end);
        }
        setData(events);
        console.log(events);
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
          console.log(e);
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
  }, [notifToken]);
  console.log(data);
  console.log(broadcasts);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <TimelineCalendarScreen newEvents={data} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = EStyleSheet.create({
  timeline: {
    maxHeight: "36rem",
  },
});

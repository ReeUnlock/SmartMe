import { Component } from "react";
import { Box, Heading, Text, Button } from "@chakra-ui/react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100dvh"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={8}
          bg="bg.DEFAULT"
        >
          <Heading size="lg" mb={4}>
            {"Ups! Coś poszło nie tak"}
          </Heading>
          <Text mb={6} color="gray.600">
            {"Przepraszamy za niedogodności. Spróbuj odświeżyć stronę."}
          </Text>
          <Button
            colorPalette="rose"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            {"Odśwież stronę"}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

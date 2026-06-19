package net.deckserver.jol.cucumber;

import io.cucumber.core.cli.Main;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Runs all Cucumber feature files under src/test/resources/features/ inside the
 * live Quarkus test container. Uses Cucumber's Main.run() with the Quarkus test
 * classloader so step definitions in net.deckserver.jol.cucumber.steps are found.
 */
@QuarkusTest
class CucumberTest {

    @Test
    void runScenarios() {
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

        byte exitCode = Main.run(new String[]{
                "--glue", "net.deckserver.jol.cucumber.steps",
                "--plugin", "pretty",
                "--plugin", "html:target/cucumber-reports/cucumber.html",
                "--tags", "not @pending",
                "classpath:features"
        }, classLoader);

        assertEquals((byte) 0, exitCode, "One or more Cucumber scenarios failed — see output above");
    }
}

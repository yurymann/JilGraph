package muv;

import java.io.IOException;

import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.fluent.Request;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

/**
 * Unit test for simple App.
 */
public class JilWebServerTest 
    extends TestCase
{
    private JilWebServer jilWebServer;

	@Override
	protected void setUp() throws Exception {
		jilWebServer = new JilWebServer();
	}

	@Override
	protected void tearDown() throws Exception {
		JilWebServer.
	}

	/**
     * Create the test case
     *
     * @param testName name of the test case
     */
    public JilWebServerTest( String testName )
    {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite()
    {
        return new TestSuite( JilWebServerTest.class );
    }

    /**
     * Test retrieving file by Get request. 
     * @throws IOException 
     * @throws ClientProtocolException 
     */
    public void testGetFile() throws ClientProtocolException, IOException
    {
        String filePath = "http://localhost:8080/test-path/test1.txt";
        String result = Request.Get(filePath).execute().returnContent().asString();
    	assertEquals("Test text of test1", result);
    }
}
